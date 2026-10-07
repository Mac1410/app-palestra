/**
 * Server statico per provare la web app costruita, prima di pubblicarla.
 *
 *   node scripts/serve-dist.mjs [percorso-di-base] [porta]
 *
 * Riproduce le condizioni di GitHub Pages: l'app risponde sotto il percorso di
 * base e gli indirizzi sconosciuti ricadono su index.html. Su localhost il
 * browser considera la connessione sicura, quindi anche il service worker si
 * registra come succederà online.
 */

import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import process from 'node:process';

const DIST = path.resolve(import.meta.dirname, '../dist');

const base = `/${(process.argv[2] ?? 'app-palestra').replace(/^\/+|\/+$/g, '')}/`.replace(
  '//',
  '/',
);
const port = Number(process.argv[3] ?? 8088);

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.webmanifest': 'application/manifest+json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.ttf': 'font/ttf',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.map': 'application/json; charset=utf-8',
};

if (!fs.existsSync(DIST)) {
  console.error('dist non esiste: lancia prima "npm run build:web"');
  process.exit(1);
}

http
  .createServer((request, response) => {
    const url = new URL(request.url ?? '/', `http://${request.headers.host}`);

    if (base !== '/' && !url.pathname.startsWith(base)) {
      response.writeHead(302, { location: base });
      response.end();
      return;
    }

    const relative = url.pathname.slice(base.length);
    let file = path.join(DIST, relative);

    if (!file.startsWith(DIST)) {
      response.writeHead(403).end('vietato');
      return;
    }
    if (!relative || relative.endsWith('/') || !fs.existsSync(file)) {
      // App a pagina singola: ogni rotta è servita da index.html.
      file = path.join(DIST, 'index.html');
    }

    const body = fs.readFileSync(file);
    response.writeHead(200, {
      'content-type': TYPES[path.extname(file)] ?? 'application/octet-stream',
      // Niente cache del server: durante le prove conta solo il service worker.
      'cache-control': 'no-store',
    });
    response.end(body);
  })
  .listen(port, () => {
    console.log(`web app in prova su http://localhost:${port}${base}`);
  });
