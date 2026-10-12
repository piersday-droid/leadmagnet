// Zero-dependency server for The Long Way Home.
// Serves ./public and collects poster sign-ups at POST /api/subscribe.
//
// Env:
//   PORT                   port to listen on (Railway sets this)
//   DATA_DIR               where subscribers.jsonl is written (default ./data;
//                          mount a Railway volume here so sign-ups survive deploys)
//   SUBSCRIBE_WEBHOOK_URL  optional; every sign-up is also POSTed here as JSON
//                          (Zapier, Make, ConvertKit, Mailchimp via a zap, etc.)

const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = Number(process.env.PORT) || 3000;
const PUBLIC_DIR = path.join(__dirname, 'public');
const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, 'data');
const WEBHOOK = process.env.SUBSCRIBE_WEBHOOK_URL || '';

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.ico': 'image/x-icon',
  '.pdf': 'application/pdf',
  '.txt': 'text/plain; charset=utf-8'
};

fs.mkdirSync(DATA_DIR, { recursive: true });
const SUBSCRIBERS = path.join(DATA_DIR, 'subscribers.jsonl');

// Simple in-memory rate limit: 10 sign-ups per IP per hour.
const hits = new Map();
function limited(ip) {
  const now = Date.now();
  const recent = (hits.get(ip) || []).filter(t => now - t < 3600e3);
  recent.push(now);
  hits.set(ip, recent);
  return recent.length > 10;
}

function send(res, status, body, headers = {}) {
  res.writeHead(status, Object.assign({ 'X-Content-Type-Options': 'nosniff' }, headers));
  res.end(body);
}
const json = (res, status, obj) => send(res, status, JSON.stringify(obj), { 'Content-Type': 'application/json; charset=utf-8' });

function readBody(req, limit = 10 * 1024) {
  return new Promise((resolve, reject) => {
    let size = 0;
    const chunks = [];
    req.on('data', c => {
      size += c.length;
      if (size > limit) { reject(new Error('too large')); req.destroy(); return; }
      chunks.push(c);
    });
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
    req.on('error', reject);
  });
}

async function subscribe(req, res) {
  const ip = (req.headers['x-forwarded-for'] || req.socket.remoteAddress || '').split(',')[0].trim();
  if (limited(ip)) return json(res, 429, { ok: false, error: 'Too many attempts. Please try again later.' });

  let data;
  try { data = JSON.parse(await readBody(req)); } catch { return json(res, 400, { ok: false, error: 'Bad request.' }); }

  const email = String(data.email || '').trim().toLowerCase().slice(0, 200);
  const name = String(data.name || '').trim().slice(0, 80);
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return json(res, 400, { ok: false, error: 'That email address does not look quite right.' });

  const record = { email, name, source: String(data.source || 'the-long-way-home').slice(0, 60), at: new Date().toISOString() };
  try {
    await fs.promises.appendFile(SUBSCRIBERS, JSON.stringify(record) + '\n');
  } catch (err) {
    console.error('could not save subscriber', err);
    return json(res, 500, { ok: false, error: 'Something went wrong. Please try again in a minute.' });
  }
  console.log('new subscriber', email);

  if (WEBHOOK) {
    fetch(WEBHOOK, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(record) })
      .then(r => { if (!r.ok) console.error('webhook responded', r.status); })
      .catch(err => console.error('webhook failed', err.message));
  }
  json(res, 200, { ok: true });
}

function serveStatic(req, res) {
  let urlPath;
  try { urlPath = decodeURIComponent(new URL(req.url, 'http://x').pathname); } catch { return send(res, 400, 'Bad request'); }
  if (urlPath.endsWith('/')) urlPath += 'index.html';
  const file = path.normalize(path.join(PUBLIC_DIR, urlPath));
  if (!file.startsWith(PUBLIC_DIR + path.sep)) return send(res, 403, 'Forbidden');

  fs.stat(file, (err, stat) => {
    if (err || !stat.isFile()) return send(res, 404, 'Not found', { 'Content-Type': 'text/plain; charset=utf-8' });
    const ext = path.extname(file).toLowerCase();
    res.writeHead(200, {
      'Content-Type': TYPES[ext] || 'application/octet-stream',
      'Content-Length': stat.size,
      'Cache-Control': ext === '.html' ? 'no-cache' : 'public, max-age=86400',
      'X-Content-Type-Options': 'nosniff'
    });
    if (req.method === 'HEAD') return res.end();
    fs.createReadStream(file).pipe(res);
  });
}

const server = http.createServer((req, res) => {
  if (req.url === '/health') return json(res, 200, { ok: true });
  if (req.url === '/api/subscribe') {
    if (req.method !== 'POST') return json(res, 405, { ok: false, error: 'Method not allowed.' });
    return subscribe(req, res).catch(err => { console.error(err); json(res, 500, { ok: false, error: 'Server error.' }); });
  }
  if (req.method !== 'GET' && req.method !== 'HEAD') return send(res, 405, 'Method not allowed');
  serveStatic(req, res);
});

server.listen(PORT, () => console.log(`The Long Way Home running on http://localhost:${PORT}`));
