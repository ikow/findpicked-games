// Cloudflare Worker — Leaderboard API with anti-abuse
// KV namespace: LEADERBOARD

const GAMES = {
  // === Puzzle ===
  '2048':            { min: 0, max: 500000 },
  slidingpuzzle:     { min: 1, max: 9999 },    // moves (lower better)
  lightsout:         { min: 1, max: 999 },      // moves
  nonogram:          { min: 1, max: 7200 },     // seconds
  sokoban:           { min: 1, max: 9999 },     // moves
  hanoi:             { min: 1, max: 9999 },     // moves
  colorflood:        { min: 1, max: 999 },      // moves
  pipeconnect:       { min: 1, max: 7200 },     // seconds
  kenken:            { min: 1, max: 7200 },     // seconds
  binarypuzzle:      { min: 1, max: 7200 },     // seconds
  kakuro:            { min: 1, max: 7200 },     // seconds
  sudoku:            { min: 1, max: 7200 },     // seconds
  minesweeper:       { min: 1, max: 999 },      // seconds
  wordle:            { min: 1, max: 6 },        // guesses
  hextris:           { min: 0, max: 999999 },
  blockdrop:         { min: 0, max: 999999 },
  magicsquare:       { min: 1, max: 7200 },     // seconds
  numberchain:       { min: 1, max: 7200 },     // seconds
  mahjong:           { min: 1, max: 7200 },     // seconds

  // === Cards ===
  solitaire:         { min: 1, max: 3600 },     // seconds
  freecell:          { min: 1, max: 3600 },     // seconds
  spidersolitaire:   { min: 1, max: 7200 },     // seconds
  blackjack:         { min: 0, max: 999999 },   // chips
  hearts:            { min: 0, max: 999 },       // points (lower better)
  videopoker:        { min: 0, max: 999999 },   // chips
  war:               { min: 0, max: 52 },        // cards won
  crazyeights:       { min: 0, max: 999 },       // points

  // === Strategy ===
  chess:             { min: 0, max: 9999 },
  checkers:          { min: 0, max: 9999 },
  gomoku:            { min: 0, max: 9999 },
  reversi:           { min: 0, max: 64 },        // discs
  connectfour:       { min: 0, max: 9999 },
  tictactoe:         { min: 0, max: 9999 },
  battleship:        { min: 1, max: 999 },       // shots (lower better)
  dotsandboxes:      { min: 0, max: 999 },
  nim:               { min: 0, max: 9999 },
  hex:               { min: 0, max: 9999 },
  xiangqi:           { min: 0, max: 9999 },

  // === Word & Trivia ===
  hangman:           { min: 0, max: 99999 },
  wordsearch:        { min: 0, max: 99999 },
  typingtest:        { min: 0, max: 300 },       // WPM
  trivia:            { min: 0, max: 99999 },
  anagram:           { min: 0, max: 99999 },
  boggle:            { min: 0, max: 99999 },
  spellingbee:       { min: 0, max: 99999 },
  cryptogram:        { min: 1, max: 7200 },      // seconds
  wordladder:        { min: 1, max: 999 },       // moves
  wordscramble:      { min: 0, max: 99999 },

  // === Math & Logic ===
  mathsprint:        { min: 0, max: 999 },
  game24:            { min: 0, max: 99999 },
  equationbuilder:   { min: 0, max: 99999 },
  primeornot:        { min: 0, max: 999 },
  fibonacci:         { min: 0, max: 999 },
  mentalmath:        { min: 0, max: 999 },

  // === Arcade ===
  pacman:            { min: 0, max: 999999 },
  snake:             { min: 0, max: 500 },
  snakeio:           { min: 0, max: 99999 },
  flappybird:        { min: 0, max: 300 },
  flappydunk:        { min: 0, max: 300 },
  breakout:          { min: 0, max: 999999 },
  pong:              { min: 0, max: 999 },
  spaceinvaders:     { min: 0, max: 999999 },
  asteroids:         { min: 0, max: 999999 },
  frogger:           { min: 0, max: 999999 },
  doodlejump:        { min: 0, max: 999999 },
  fruitninja:        { min: 0, max: 9999 },
  whackamole:        { min: 0, max: 9999 },
  helicopter:        { min: 0, max: 99999 },
  trexrunner:        { min: 0, max: 99999 },
  geometrydash:      { min: 0, max: 99999 },
  dodgeball:         { min: 0, max: 99999 },
  knifehit:          { min: 0, max: 9999 },
  bubbleshooter:     { min: 0, max: 999999 },
  match3:            { min: 0, max: 999999 },
  catchfalling:      { min: 0, max: 99999 },

  // === Quick Play ===
  simonsays:         { min: 0, max: 999 },       // rounds
  memorymatch:       { min: 1, max: 9999 },      // moves or time
  pianotiles:        { min: 0, max: 9999 },
  colorswitch:       { min: 0, max: 999 },
  stacktower:        { min: 0, max: 999 },
  ballsort:          { min: 1, max: 9999 },      // moves
  taptap:            { min: 0, max: 999 },
  speedclick:        { min: 0, max: 999 },       // clicks
  aimtrainer:        { min: 0, max: 9999 },
  reactiontest:      { min: 1, max: 5000 },      // ms (lower better)
  rockpaperscissors: { min: 0, max: 999 },
  numberguess:       { min: 1, max: 100 },       // guesses (lower better)
  colorpicker:       { min: 0, max: 99999 },
  rhythmgame:        { min: 0, max: 999999 },

  // === Creative & Science (most don't have scores, but include for completeness) ===
  drawingcanvas:     { min: 0, max: 0 },
  pixelart:          { min: 0, max: 0 },
  musicmaker:        { min: 0, max: 0 },
  gameoflife:        { min: 0, max: 0 },
  mandelbrot:        { min: 0, max: 0 },
  particles:         { min: 0, max: 0 },
  gravitysim:        { min: 0, max: 0 },
  pendulumwave:      { min: 0, max: 0 },
  lissajous:         { min: 0, max: 0 },
  zengarden:         { min: 0, max: 0 },
  dotconnect:        { min: 1, max: 7200 },      // seconds
  mazerunner:        { min: 1, max: 7200 },      // seconds
};

// Games where lower score is better
const LOWER_IS_BETTER = new Set([
  'minesweeper', 'slidingpuzzle', 'lightsout', 'nonogram', 'sokoban',
  'hanoi', 'colorflood', 'pipeconnect', 'kenken', 'binarypuzzle',
  'kakuro', 'sudoku', 'wordle', 'magicsquare', 'numberchain', 'mahjong',
  'solitaire', 'freecell', 'spidersolitaire', 'hearts', 'cryptogram',
  'wordladder', 'battleship', 'reactiontest', 'numberguess', 'ballsort',
  'memorymatch', 'dotconnect', 'mazerunner',
]);

const MAX_ENTRIES = 50;
const RATE_WINDOW = 60;
const RATE_MAX = 3;
const GLOBAL_RATE_WINDOW = 300;
const GLOBAL_RATE_MAX = 10;
const TOKEN_TTL = 300;
const TOKEN_SECRET_KEY = 'fp-lb-2026';

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

async function makeToken(ip, game, ts) {
  const data = `${TOKEN_SECRET_KEY}:${ip}:${game}:${ts}`;
  const enc = new TextEncoder().encode(data);
  const hash = await crypto.subtle.digest('SHA-256', enc);
  return btoa(String.fromCharCode(...new Uint8Array(hash))).slice(0, 24);
}

async function verifyToken(token, ip, game) {
  const now = Math.floor(Date.now() / 1000);
  for (let t = now; t > now - TOKEN_TTL; t -= 30) {
    const bucket = Math.floor(t / 30) * 30;
    const expected = await makeToken(ip, game, bucket);
    if (token === expected) return true;
  }
  return false;
}

async function checkRate(env, key, window, max) {
  const now = Math.floor(Date.now() / 1000);
  const bucket = Math.floor(now / window) * window;
  const rlKey = `rl:${key}:${bucket}`;
  const count = parseInt(await env.LEADERBOARD.get(rlKey) || '0');
  if (count >= max) return false;
  await env.LEADERBOARD.put(rlKey, String(count + 1), { expirationTtl: window * 2 });
  return true;
}

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

    // GET /api/token/:game
    const tokenMatch = path.match(/^\/api\/token\/(\w+)$/);
    if (tokenMatch && request.method === 'GET') {
      const game = tokenMatch[1];
      if (!(game in GAMES)) return json({ error: 'Unknown game' }, 400);
      return json({ token: await makeToken(ip, game, Math.floor(Date.now() / 30000) * 30), expires: 300 });
    }

    // GET /api/scores/:game
    const getMatch = path.match(/^\/api\/scores\/(\w+)$/);
    if (getMatch && request.method === 'GET') {
      const game = getMatch[1];
      if (!(game in GAMES)) return json({ error: 'Unknown game' }, 400);
      const data = await env.LEADERBOARD.get(`scores:${game}`, 'json');
      return json({ game, scores: data || [] });
    }

    // POST /api/scores/:game
    if (getMatch && request.method === 'POST') {
      const game = getMatch[1];
      if (!(game in GAMES)) return json({ error: 'Unknown game' }, 400);

      const bounds = GAMES[game];
      if (bounds.min === 0 && bounds.max === 0) {
        return json({ error: 'This game does not support leaderboard' }, 400);
      }

      if (!await checkRate(env, `${game}:${ip}`, RATE_WINDOW, RATE_MAX)) {
        return json({ error: 'Too many submissions. Try again later.' }, 429);
      }
      if (!await checkRate(env, `global:${ip}`, GLOBAL_RATE_WINDOW, GLOBAL_RATE_MAX)) {
        return json({ error: 'Too many submissions. Slow down.' }, 429);
      }

      const body = await request.json().catch(() => null);
      if (!body) return json({ error: 'Invalid JSON' }, 400);

      const { name, score, token } = body;

      if (!token || !await verifyToken(token, ip, game)) {
        return json({ error: 'Invalid or expired token. Refresh and try again.' }, 403);
      }

      if (!name || typeof name !== 'string' || name.trim().length === 0 || name.length > 20) {
        return json({ error: 'Name required (max 20 chars)' }, 400);
      }
      const cleanName = name.trim().slice(0, 20);

      if (typeof score !== 'number' || !Number.isFinite(score)) {
        return json({ error: 'Invalid score' }, 400);
      }
      if (score < bounds.min || score > bounds.max) {
        return json({ error: 'Score out of range' }, 400);
      }

      const fp = await fingerprint(ip, ua);
      const dedupKey = `dedup:${game}:${fp}:${Math.round(score)}`;
      const existing = await env.LEADERBOARD.get(dedupKey);
      if (existing) {
        return json({ error: 'Duplicate submission detected' }, 409);
      }
      await env.LEADERBOARD.put(dedupKey, '1', { expirationTtl: 300 });

      const key = `scores:${game}`;
      const scores = (await env.LEADERBOARD.get(key, 'json')) || [];

      const entry = {
        name: cleanName,
        score: Math.round(score),
        date: new Date().toISOString().slice(0, 10),
        fp: fp.slice(0, 8),
      };

      scores.push(entry);

      if (LOWER_IS_BETTER.has(game)) {
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
        const bounds = GAMES[game];
        if (bounds.min === 0 && bounds.max === 0) continue;
        const data = (await env.LEADERBOARD.get(`scores:${game}`, 'json')) || [];
        summary[game] = data.slice(0, 3);
      }
      return json({ games: summary });
    }

    return json({ error: 'Not found' }, 404);
  },
};
