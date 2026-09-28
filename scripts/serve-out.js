#!/usr/bin/env node
// Serves the static export in out/ the way GitHub Pages does (/make is make.html, a missing page
// is 404.html), so the e2e tests run against what is deployed rather than the dev server, which
// compiles each page on its first visit and can take longer than a test waits.
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..', 'out');
const port = Number(process.env.PORT ?? 3000);
const types = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.txt': 'text/plain; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
  '.glb': 'model/gltf-binary',
  '.xml': 'application/xml',
};

const file = (p) => {
  try {
    return fs.statSync(p).isFile() ? p : null;
  } catch {
    return null;
  }
};

http
  .createServer((req, res) => {
    let url;
    try {
      url = decodeURIComponent(new URL(req.url, 'http://x').pathname);
    } catch {
      res.writeHead(400).end();
      return;
    }
    const base = path.join(root, path.normalize(url));
    if (!base.startsWith(root)) {
      res.writeHead(403).end();
      return;
    }
    const found = file(base) ?? file(`${base}.html`) ?? file(path.join(base, 'index.html'));
    const target = found ?? path.join(root, '404.html');
    res.writeHead(found ? 200 : 404, { 'content-type': types[path.extname(target)] ?? 'application/octet-stream' });
    fs.createReadStream(target).pipe(res);
  })
  .listen(port, '127.0.0.1', () => console.log(`serving out/ on http://127.0.0.1:${port}`));
