// Cloudflare Worker — Leaderboard API with anti-abuse
// KV namespace: LEADERBOARD

const GAMES = {
  snake:       { min: 0, max: 500 },
  '2048':      { min: 0, max: 500000 },
  blockdrop:   { min: 0, max: 999999 },
  minesweeper: { min: 1, max: 999 },
  flappybird:  { min: 0, max: 300 },
  gomoku:      { min: 0, max: 9999 },
  hextris:     { min: 0, max: 999999 },
  pacman:      { min: 0, max: 999999 },
  solitaire:   { min: 1, max: 3600 },
  sudoku:      { min: 1, max: 7200 },
  wordle:      { min: 1, max: 6 },
};

const MAX_ENTRIES = 50;
const RATE_WINDOW = 60;          // 1 min
const RATE_MAX = 3;              // max 3 submits per game per IP per minute
const GLOBAL_RATE_WINDOW = 300;  // 5 min
const GLOBAL_RATE_MAX = 10;      // max 10 total submits per IP per 5 min
const TOKEN_TTL = 300;           // challenge token valid 5 min
const TOKEN_SECRET_KEY = 'fp-lb-2026'; // rotated periodically

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', ...CORS },
  });
}

// Simple HMAC-like token using Web Crypto
async function makeToken(ip, game, ts) {
  const data = `${TOKEN_SECRET_KEY}:${ip}:${game}:${ts}`;
  const enc = new TextEncoder().encode(data);
  const hash = await crypto.subtle.digest('SHA-256', enc);
  return btoa(String.fromCharCode(...new Uint8Array(hash))).slice(0, 24);
}

async function verifyToken(token, ip, game) {
  const now = Math.floor(Date.now() / 1000);
  // Check tokens from last TOKEN_TTL seconds (in 30s buckets)
  for (let t = now; t > now - TOKEN_TTL; t -= 30) {
    const bucket = Math.floor(t / 30) * 30;
    const expected = await makeToken(ip, game, bucket);
    if (token === expected) return true;
  }
  return false;
}

// Rate limiting via KV
async function checkRate(env, key, window, max) {
  const now = Math.floor(Date.now() / 1000);
  const bucket = Math.floor(now / window) * window;
  const rlKey = `rl:${key}:${bucket}`;
  const count = parseInt(await env.LEADERBOARD.get(rlKey) || '0');
  if (count >= max) return false;
  await env.LEADERBOARD.put(rlKey, String(count + 1), { expirationTtl: window * 2 });
  return true;
}

// Fingerprint: hash IP + UA for dedup
async function fingerprint(ip, ua) {
  const data = `${ip}:${ua}`;
  const enc = new TextEncoder().encode(data);
  const hash = await crypto.subtle.digest('SHA-256', enc);
  return btoa(String.fromCharCode(...new Uint8Array(hash))).slice(0, 16);
}

export default {
  async fetch(request, env) {
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: CORS });
    }

    const url = new URL(request.url);
    const path = url.pathname;
    const ip = request.headers.get('CF-Connecting-IP') || 'unknown';
    const ua = request.headers.get('User-Agent') || '';

    // GET /api/token/:game — get challenge token (must be called before submit)
    const tokenMatch = path.match(/^\/api\/token\/(\w+)$/);
    if (tokenMatch && request.method === 'GET') {
      const game = tokenMatch[1];
      if (!(game in GAMES)) return json({ error: 'Unknown game' }, 400);
      const ts = Math.floor(Date.now() / 30000) * 30;
      const token = await makeToken(ip, game, ts);
      return json({ token, expires: 300 });
    }

    // GET /api/scores/:game
    const getMatch = path.match(/^\/api\/scores\/(\w+)$/);
    if (getMatch && request.method === 'GET') {
      const game = getMatch[1];
      if (!(game in GAMES)) return json({ error: 'Unknown game' }, 400);
      const data = await env.LEADERBOARD.get(`scores:${game}`, 'json');
      return json({ game, scores: data || [] });
    }

    // POST /api/scores/:game — submit score
    if (getMatch && request.method === 'POST') {
      const game = getMatch[1];
      if (!(game in GAMES)) return json({ error: 'Unknown game' }, 400);

      // 1. Rate limit — per game per IP
      if (!await checkRate(env, `${game}:${ip}`, RATE_WINDOW, RATE_MAX)) {
        return json({ error: 'Too many submissions. Try again later.' }, 429);
      }
      // 2. Global rate limit — all games per IP
      if (!await checkRate(env, `global:${ip}`, GLOBAL_RATE_WINDOW, GLOBAL_RATE_MAX)) {
        return json({ error: 'Too many submissions. Slow down.' }, 429);
      }

      const body = await request.json().catch(() => null);
      if (!body) return json({ error: 'Invalid JSON' }, 400);

      const { name, score, token } = body;

      // 3. Validate token (proof the client loaded the game page)
      if (!token || !await verifyToken(token, ip, game)) {
        return json({ error: 'Invalid or expired token. Refresh and try again.' }, 403);
      }

      // 4. Validate name
      if (!name || typeof name !== 'string' || name.trim().length === 0 || name.length > 20) {
        return json({ error: 'Name required (max 20 chars)' }, 400);
      }
      const cleanName = name.trim().slice(0, 20);

      // 5. Validate score range
      if (typeof score !== 'number' || !Number.isFinite(score)) {
        return json({ error: 'Invalid score' }, 400);
      }
      const bounds = GAMES[game];
      if (score < bounds.min || score > bounds.max) {
        return json({ error: 'Score out of range' }, 400);
      }

      // 6. Dedup — same fingerprint can't submit same score within 5 min
      const fp = await fingerprint(ip, ua);
      const dedupKey = `dedup:${game}:${fp}:${Math.round(score)}`;
      const existing = await env.LEADERBOARD.get(dedupKey);
      if (existing) {
        return json({ error: 'Duplicate submission detected' }, 409);
      }
      await env.LEADERBOARD.put(dedupKey, '1', { expirationTtl: 300 });

      // 7. Save score
      const key = `scores:${game}`;
      const scores = (await env.LEADERBOARD.get(key, 'json')) || [];

      const entry = {
        name: cleanName,
        score: Math.round(score),
        date: new Date().toISOString().slice(0, 10),
        fp: fp.slice(0, 8), // partial fingerprint for admin review
      };

      scores.push(entry);

      if (game === 'minesweeper') {
        scores.sort((a, b) => a.score - b.score);
      } else {
        scores.sort((a, b) => b.score - a.score);
      }

      const trimmed = scores.slice(0, MAX_ENTRIES);
      await env.LEADERBOARD.put(key, JSON.stringify(trimmed));

      const rank = trimmed.findIndex(e =>
        e.name === entry.name && e.score === entry.score && e.date === entry.date
      ) + 1;

      return json({ rank: rank || trimmed.length, total: trimmed.length });
    }

    // GET /api/scores — all games summary
    if (path === '/api/scores' && request.method === 'GET') {
      const summary = {};
      for (const game of Object.keys(GAMES)) {
        const data = (await env.LEADERBOARD.get(`scores:${game}`, 'json')) || [];
        summary[game] = data.slice(0, 3);
      }
      return json({ games: summary });
    }

    return json({ error: 'Not found' }, 404);
  },
};
