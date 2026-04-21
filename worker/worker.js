// Cloudflare Worker — Leaderboard API
// KV namespace: LEADERBOARD

const GAMES = ['snake', '2048', 'blockdrop', 'minesweeper', 'flappybird', 'gomoku'];
const MAX_ENTRIES = 50;
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

export default {
  async fetch(request, env) {
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: CORS });
    }

    const url = new URL(request.url);
    const path = url.pathname;

    // GET /api/scores/:game — get top scores
    const getMatch = path.match(/^\/api\/scores\/(\w+)$/);
    if (getMatch && request.method === 'GET') {
      const game = getMatch[1];
      if (!GAMES.includes(game)) return json({ error: 'Unknown game' }, 400);

      const data = await env.LEADERBOARD.get(`scores:${game}`, 'json');
      return json({ game, scores: data || [] });
    }

    // POST /api/scores/:game — submit a score
    if (getMatch && request.method === 'POST') {
      const game = getMatch[1];
      if (!GAMES.includes(game)) return json({ error: 'Unknown game' }, 400);

      const body = await request.json();
      const { name, score } = body;

      if (!name || typeof name !== 'string' || name.trim().length === 0 || name.length > 20) {
        return json({ error: 'Name required (max 20 chars)' }, 400);
      }
      if (typeof score !== 'number' || score < 0 || !Number.isFinite(score)) {
        return json({ error: 'Invalid score' }, 400);
      }

      const key = `scores:${game}`;
      const existing = (await env.LEADERBOARD.get(key, 'json')) || [];

      // For gomoku, lower score (fewer moves) is better; for others, higher is better
      const entry = {
        name: name.trim().slice(0, 20),
        score: Math.round(score),
        date: new Date().toISOString().slice(0, 10),
      };

      existing.push(entry);

      // Sort: higher is better for most games
      if (game === 'minesweeper') {
        // Lower time is better
        existing.sort((a, b) => a.score - b.score);
      } else {
        existing.sort((a, b) => b.score - a.score);
      }

      const trimmed = existing.slice(0, MAX_ENTRIES);
      await env.LEADERBOARD.put(key, JSON.stringify(trimmed));

      const rank = trimmed.findIndex(e => e === entry) + 1;
      return json({ rank, total: trimmed.length });
    }

    // GET /api/scores — all games summary (top 3 each)
    if (path === '/api/scores' && request.method === 'GET') {
      const summary = {};
      for (const game of GAMES) {
        const data = (await env.LEADERBOARD.get(`scores:${game}`, 'json')) || [];
        summary[game] = data.slice(0, 3);
      }
      return json({ games: summary });
    }

    return json({ error: 'Not found' }, 404);
  },
};
