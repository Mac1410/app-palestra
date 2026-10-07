/**
 * Compila alcuni moduli TypeScript del progetto in una cartella temporanea e
 * li rende eseguibili da Node, usato dagli script di verifica.
 *
 * Serve perché i moduli importano con l'alias "@/...", che Node non conosce:
 * dopo la compilazione gli alias vengono riscritti in percorsi relativi.
 */

import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import { createRequire } from 'node:module';
import os from 'node:os';
import path from 'node:path';
import process from 'node:process';

const ROOT = path.resolve(import.meta.dirname, '../..');

/**
 * @param {string[]} files percorsi relativi alla radice del progetto
 * @param {string} nome cartella temporanea in cui compilare
 * @returns {(modulo: string) => unknown} carica un modulo compilato, es. "lib/plan.js"
 */
export function compila(files, nome) {
  const out = path.join(os.tmpdir(), nome);
  fs.rmSync(out, { recursive: true, force: true });
  fs.mkdirSync(out, { recursive: true });

  const tsconfig = path.join(out, 'tsconfig.json');
  fs.writeFileSync(
    tsconfig,
    JSON.stringify(
      {
        compilerOptions: {
          module: 'commonjs',
          moduleResolution: 'bundler',
          target: 'es2022',
          skipLibCheck: true,
          esModuleInterop: true,
          rootDir: path.join(ROOT, 'src'),
          outDir: path.join(out, 'js'),
          types: [],
          // Percorsi assoluti: senza baseUrl, che TypeScript sta abbandonando.
          paths: { '@/*': [path.join(ROOT, 'src/*')] },
        },
        files: files.map((file) => path.join(ROOT, file)),
      },
      null,
      2,
    ),
  );

  execFileSync(process.platform === 'win32' ? 'npx.cmd' : 'npx', ['tsc', '--project', tsconfig], {
    cwd: ROOT,
    stdio: 'inherit',
    shell: process.platform === 'win32',
  });

  const js = path.join(out, 'js');

  const rewrite = (dir) => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const file = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        rewrite(file);
        continue;
      }
      if (!file.endsWith('.js')) continue;
      const text = fs.readFileSync(file, 'utf8').replace(/require\("@\/([^"]+)"\)/g, (_, sub) => {
        let rel = path.relative(path.dirname(file), path.join(js, sub)).split(path.sep).join('/');
        if (!rel.startsWith('.')) rel = `./${rel}`;
        return `require("${rel}")`;
      });
      fs.writeFileSync(file, text);
    }
  };

  rewrite(js);

  const require = createRequire(import.meta.url);
  return (modulo) => require(path.join(js, modulo));
}
