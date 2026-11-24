import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const DIST = path.join(ROOT, 'dist');
const DATA_DIR = path.join(__dirname, 'data');
const DATA_FILE = path.join(DATA_DIR, 'leaderboard.json');
const PORT = process.env.SUNSET_PORT ? Number(process.env.SUNSET_PORT) : 8080;
const HOST = process.env.HOST || '127.0.0.1';

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.map': 'application/json',
};

let scoresCache = (() => {
  try {
    return JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));
  } catch {
    return [];
  }
})();

function loadScores() {
  return scoresCache;
}

let saveTimer = null;
function saveScores(scores) {
  scoresCache = scores;
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  if (saveTimer) clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    try {
      fs.writeFileSync(DATA_FILE, JSON.stringify(scores.slice(0, 200), null, 1));
    } catch {
      /* ignore */
    }
  }, 250);
}

function readBody(req) {
  return new Promise((resolve) => {
    let raw = '';
    req.on('data', (c) => {
      raw += c;
      if (raw.length > 1e5) req.destroy();
    });
    req.on('end', () => {
      try {
        resolve(JSON.parse(raw || '{}'));
      } catch {
        resolve(null);
      }
    });
  });
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${HOST}:${PORT}`);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  if (url.pathname === '/api/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ ok: true, service: 'project-sunset-backend', time: Date.now() }));
    return;
  }

  if (url.pathname === '/api/leaderboard' && req.method === 'GET') {
    const kind = url.searchParams.get('kind') || 'all';
    let scores = loadScores();
    if (kind !== 'all') scores = scores.filter((s) => s.kind === kind);
    scores.sort((a, b) => b.value - a.value);
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ scores: scores.slice(0, 50) }));
    return;
  }

  if (url.pathname === '/api/scores' && req.method === 'POST') {
    const body = await readBody(req);
    if (!body || typeof body.name !== 'string' || typeof body.kind !== 'string' || typeof body.value !== 'number' || !Number.isFinite(body.value)) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'invalid payload: need {name, kind, value:number}' }));
      return;
    }
    const scores = loadScores();
    scores.push({ name: String(body.name).slice(0, 40), kind: String(body.kind).slice(0, 40), value: Math.round(body.value), detail: String(body.detail ?? '').slice(0, 120), at: Date.now() });
    scores.sort((a, b) => b.value - a.value);
    saveScores(scores);
    res.writeHead(201, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ ok: true, rank: scores.findIndex((s) => s.at === scores[scores.length - 1]?.at) }));
    return;
  }

  if (url.pathname === '/api/stats' && req.method === 'GET') {
    const scores = loadScores();
    const byKind = {};
    for (const s of scores) byKind[s.kind] = (byKind[s.kind] || 0) + 1;
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ total: scores.length, byKind }));
    return;
  }

  let filePath = path.join(DIST, decodeURIComponent(url.pathname));
  if (!filePath.startsWith(DIST)) {
    res.writeHead(403);
    res.end();
    return;
  }
  if (url.pathname === '/' || url.pathname === '') filePath = path.join(DIST, 'index.html');
  fs.readFile(filePath, (err, data) => {
    if (err) {
      fs.readFile(path.join(DIST, 'index.html'), (e2, fallback) => {
        if (e2) {
          res.writeHead(404);
          res.end('not found - run npm run build first');
        } else {
          res.writeHead(200, { 'Content-Type': MIME['.html'] });
          res.end(fallback);
        }
      });
      return;
    }
    const ext = path.extname(filePath);
    res.writeHead(200, { 'Content-Type': MIME[ext] || 'application/octet-stream' });
    res.end(data);
  });
});

server.listen(PORT, HOST, () => {
  console.log(`PROJECT SUNSET backend on http://${HOST}:${PORT} (static dist/ + /api/*)`);
});
