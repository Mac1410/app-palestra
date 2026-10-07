/**
 * Costruisce la web app installabile su iPhone.
 *
 *   node scripts/build-web.mjs [percorso-di-base]
 *
 * Fa tre cose che `expo export` da solo non fa:
 *  - scrive il manifest che permette a Safari di installare l'app sulla Home;
 *  - genera un service worker con l'elenco esatto dei file prodotti, così
 *    l'app si apre anche senza rete (in palestra il campo spesso manca);
 *  - aggiunge i file che servono a GitHub Pages (.nojekyll e 404.html).
 *
 * Il percorso di base dipende da dove viene pubblicata: su GitHub Pages è
 * "/nome-del-repository". Senza argomenti usa /app-palestra.
 */

import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const ROOT = path.resolve(import.meta.dirname, '..');
const DIST = path.join(ROOT, 'dist');

const BACKGROUND = '#0B0A0A';
const ACCENT = '#FF6B2C';

/** Normalizza "app-palestra" o "/app-palestra/" in "/app-palestra/". */
function normalizeBase(value) {
  const trimmed = value.replace(/^\/+|\/+$/g, '');
  return trimmed ? `/${trimmed}/` : '/';
}

const base = normalizeBase(process.argv[2] ?? 'app-palestra');

console.log(`\n▸ Costruisco la web app per il percorso ${base}\n`);

// --- 1. Export di Expo ------------------------------------------------------

fs.rmSync(DIST, { recursive: true, force: true });

// Su Windows npx è uno script PowerShell bloccato dalle policy: .cmd funziona sempre.
const npx = process.platform === 'win32' ? 'npx.cmd' : 'npx';

execFileSync(npx, ['expo', 'export', '--platform', 'web', '--output-dir', 'dist', '--clear'], {
  cwd: ROOT,
  stdio: 'inherit',
  // Node rifiuta di eseguire un .cmd senza shell.
  shell: process.platform === 'win32',
  // baseUrl senza slash finale: è il formato che si aspetta Expo.
  env: { ...process.env, PALESTRA_BASE_URL: base.replace(/\/$/, '') },
});

if (!fs.existsSync(path.join(DIST, 'index.html'))) {
  throw new Error('export non riuscito: dist/index.html non esiste');
}

// --- 2. Icona ---------------------------------------------------------------

fs.copyFileSync(path.join(ROOT, 'assets/images/icon.png'), path.join(DIST, 'icona-app.png'));

// --- 2b. Pagina HTML --------------------------------------------------------

/**
 * Expo produce un index.html minimo. Qui si aggiunge ciò che serve a Safari per
 * installare l'app sulla schermata Home e per avviarla a schermo intero.
 * (In modalità pagina singola `+html.tsx` non viene usato, quindi è qui.)
 */
function enhanceHtml(html) {
  const head = `
    <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover" />
    <meta name="description" content="Schede, allenamenti e progressi in palestra." />
    <link rel="manifest" href="${base}manifest.webmanifest" />
    <meta name="theme-color" content="${BACKGROUND}" />
    <meta name="apple-mobile-web-app-capable" content="yes" />
    <meta name="mobile-web-app-capable" content="yes" />
    <meta name="apple-mobile-web-app-status-bar-style" content="black" />
    <meta name="apple-mobile-web-app-title" content="Palestra" />
    <link rel="apple-touch-icon" href="${base}icona-app.png" />
    <style id="palestra-shell">
      html, body { background-color: ${BACKGROUND}; }
      body {
        /* Niente rimbalzo elastico: in un'app a schermo intero sembra un difetto. */
        overscroll-behavior: none;
        -webkit-text-size-adjust: 100%;
        -webkit-tap-highlight-color: transparent;
        /* Il testo non si seleziona tenendo premuto, ma nei campi sì. */
        -webkit-user-select: none;
        user-select: none;
      }
      input, textarea { -webkit-user-select: text; user-select: text; }
    </style>
    <script id="palestra-sw">
      if ('serviceWorker' in navigator) {
        window.addEventListener('load', function () {
          navigator.serviceWorker
            .register('${base}sw.js', { scope: '${base}' })
            .catch(function (error) { console.warn('[palestra] service worker non registrato', error); });
        });
      }
      // Chiede al browser di non sfrattare gli allenamenti salvati.
      if (navigator.storage && navigator.storage.persist) {
        navigator.storage.persisted().then(function (already) {
          if (!already) navigator.storage.persist();
        });
      }
    </script>
  `;

  const patched = html
    .replace('<html lang="en">', '<html lang="it">')
    // Il viewport del modello non copre la tacca né blocca lo zoom al tocco.
    .replace(/\s*<meta name="viewport"[^>]*>/, '')
    .replace('</head>', `${head}</head>`);

  if (!patched.includes('palestra-sw')) {
    throw new Error('index.html inatteso: non ho potuto inserire i tag della web app');
  }
  return patched;
}

const indexFile = path.join(DIST, 'index.html');
fs.writeFileSync(indexFile, enhanceHtml(fs.readFileSync(indexFile, 'utf8')));

// --- 3. Manifest ------------------------------------------------------------

const manifest = {
  name: 'Palestra',
  short_name: 'Palestra',
  description: 'Schede, allenamenti e progressi in palestra.',
  lang: 'it',
  dir: 'ltr',
  start_url: base,
  scope: base,
  display: 'standalone',
  orientation: 'portrait',
  background_color: BACKGROUND,
  theme_color: BACKGROUND,
  icons: [
    {
      src: `${base}icona-app.png`,
      sizes: '1024x1024',
      type: 'image/png',
      purpose: 'any',
    },
    {
      src: `${base}icona-app.png`,
      sizes: '1024x1024',
      type: 'image/png',
      purpose: 'maskable',
    },
  ],
  shortcuts: [
    {
      name: 'Allenamento in corso',
      url: `${base}sessione`,
    },
  ],
};

fs.writeFileSync(
  path.join(DIST, 'manifest.webmanifest'),
  `${JSON.stringify(manifest, null, 2)}\n`,
);

// --- 4. Service worker -----------------------------------------------------

/** Tutti i file prodotti, con il percorso con cui il browser li chiederà. */
function collectFiles(dir, prefix = '') {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const relative = `${prefix}${entry.name}`;
    if (entry.isDirectory()) return collectFiles(path.join(dir, entry.name), `${relative}/`);
    return [relative];
  });
}

const precache = collectFiles(DIST)
  .filter((file) => !file.endsWith('.map') && file !== 'sw.js')
  .map((file) => `${base}${file}`);

// La radice risponde all'apertura dell'app: va in cache anche lei.
precache.unshift(base);

// Cambia a ogni build: forza l'aggiornamento della cache quando pubblico.
const version = new Date().toISOString().replace(/[^0-9]/g, '').slice(0, 14);

const serviceWorker = `/* Palestra — service worker generato da scripts/build-web.mjs. Non modificare a mano. */
const CACHE = 'palestra-${version}';
const BASE = '${base}';
const PRECACHE = ${JSON.stringify(precache, null, 2)};

self.addEventListener('install', (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE);
      // addAll fallisce in blocco al primo errore: meglio file per file.
      await Promise.all(
        PRECACHE.map((url) =>
          cache.add(new Request(url, { cache: 'reload' })).catch((error) => {
            console.warn('[palestra] non in cache:', url, error);
          }),
        ),
      );
      await self.skipWaiting();
    })(),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const names = await caches.keys();
      await Promise.all(names.filter((name) => name !== CACHE).map((name) => caches.delete(name)));
      await self.clients.claim();
    })(),
  );
});

self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  // Navigazione: una sola pagina serve tutte le schermate dell'app.
  if (request.mode === 'navigate') {
    event.respondWith(
      (async () => {
        const cache = await caches.open(CACHE);
        try {
          const fresh = await fetch(request);
          cache.put(BASE, fresh.clone());
          return fresh;
        } catch {
          return (await cache.match(BASE)) ?? Response.error();
        }
      })(),
    );
    return;
  }

  // Tutto il resto ha un nome con impronta: la copia in cache è sempre valida.
  event.respondWith(
    (async () => {
      const cache = await caches.open(CACHE);
      const hit = await cache.match(request);
      if (hit) return hit;
      const response = await fetch(request);
      if (response.ok && response.type === 'basic') cache.put(request, response.clone());
      return response;
    })(),
  );
});
`;

fs.writeFileSync(path.join(DIST, 'sw.js'), serviceWorker);

// --- 5. File per GitHub Pages ----------------------------------------------

// Senza .nojekyll Pages ignora le cartelle che iniziano con "_" (c'è _expo).
fs.writeFileSync(path.join(DIST, '.nojekyll'), '');

// L'app è una sola pagina: ogni indirizzo sconosciuto rimanda a index.html.
fs.copyFileSync(path.join(DIST, 'index.html'), path.join(DIST, '404.html'));

const size = precache.reduce((sum, file) => {
  const local = path.join(DIST, file.slice(base.length));
  return sum + (fs.existsSync(local) ? fs.statSync(local).size : 0);
}, 0);

console.log(`\n✓ dist pronta — ${precache.length} file, ${(size / 1024 / 1024).toFixed(1)} MB`);
console.log(`  manifest, service worker (palestra-${version}) e icona inclusi\n`);
