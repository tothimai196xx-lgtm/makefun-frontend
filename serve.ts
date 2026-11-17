// Static server for local development and testing: serves app/ at the root
// so http://localhost:8080 opens the frontend exactly as any static host
// would. No build step, no proxying, no network calls of its own.
//
//   node serve.ts [--port 8080]

import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join, normalize, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const APP_DIR = resolve(fileURLToPath(new URL('./app', import.meta.url)));

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
};

function portFromArgs() {
  const i = process.argv.indexOf('--port');
  const raw = i >= 0 ? process.argv[i + 1] : process.env.PORT;
  const n = Number(raw ?? 8080);
  return Number.isInteger(n) && n > 0 && n < 65536 ? n : 8080;
}

const server = createServer(async (req, res) => {
  try {
    if (req.method !== 'GET' && req.method !== 'HEAD') {
      res.writeHead(405, { allow: 'GET, HEAD', 'content-type': 'text/plain' });
      res.end('Method not allowed\n');
      return;
    }
    const url = new URL(req.url || '/', 'http://localhost');
    let path = decodeURIComponent(url.pathname);
    if (path === '/') path = '/index.html';
    const file = resolve(join(APP_DIR, normalize(path).replace(/^(\.\.[/\\])+/, '')));
    if (!file.startsWith(APP_DIR + sep)) {
      res.writeHead(403, { 'content-type': 'text/plain' });
      res.end('Forbidden\n');
      return;
    }
    const body = await readFile(file);
    res.writeHead(200, {
      'content-type': TYPES[extname(file).toLowerCase()] || 'application/octet-stream',
      'content-length': body.length,
      'cache-control': 'no-store',
    });
    res.end(req.method === 'HEAD' ? undefined : body);
  } catch (err) {
    if (err?.code === 'ENOENT' || err?.code === 'EISDIR') {
      res.writeHead(404, { 'content-type': 'text/plain' });
      res.end('Not found\n');
      return;
    }
    res.writeHead(500, { 'content-type': 'text/plain' });
    res.end('Server error\n');
  }
});

const port = portFromArgs();
server.listen(port, () => {
  console.log(`Serving app/ at http://localhost:${port}`);
});
