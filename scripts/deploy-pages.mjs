/**
 * Pubblica la web app su GitHub Pages.
 *
 *   node scripts/deploy-pages.mjs            → costruisce e pubblica
 *   node scripts/deploy-pages.mjs --no-build → pubblica la dist esistente
 *
 * Il sito vive sul ramo `gh-pages`, che contiene solo il risultato della
 * build: viene riscritto a ogni pubblicazione, mentre il codice resta su
 * `main`. Il nome del repository fa anche da percorso di base del sito.
 */

import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const ROOT = path.resolve(import.meta.dirname, '..');
const DIST = path.join(ROOT, 'dist');
const BRANCH = 'gh-pages';

const run = (command, args, options = {}) =>
  execFileSync(command, args, {
    cwd: options.cwd ?? ROOT,
    encoding: 'utf8',
    stdio: options.quiet ? 'pipe' : 'inherit',
    shell: process.platform === 'win32' && !command.endsWith('git'),
    ...options,
  });

// Il repository remoto di `main` è anche quello del sito.
const remote = run('git', ['remote', 'get-url', 'origin'], { quiet: true }).trim();
const repoName = path.basename(remote.replace(/\.git$/, ''));

if (!process.argv.includes('--no-build')) {
  run('node', ['scripts/build-web.mjs', repoName]);
}

if (!fs.existsSync(path.join(DIST, 'index.html'))) {
  throw new Error('dist non pronta: lancia prima "npm run build:web"');
}

// Un repository usa e getta dentro dist: il ramo pubblicato non ha storia da
// conservare e così non si tocca il repository principale.
fs.rmSync(path.join(DIST, '.git'), { recursive: true, force: true });

run('git', ['init', '-b', BRANCH], { cwd: DIST, quiet: true });

// Il repository temporaneo non eredita la configurazione: senza nome e email
// git si rifiuta di creare il commit.
const author = {
  name: run('git', ['log', '-1', '--format=%an'], { quiet: true }).trim() || 'Palestra',
  email: run('git', ['log', '-1', '--format=%ae'], { quiet: true }).trim() || 'palestra@local',
};
run('git', ['config', 'user.name', author.name], { cwd: DIST, quiet: true });
run('git', ['config', 'user.email', author.email], { cwd: DIST, quiet: true });

run('git', ['add', '-A'], { cwd: DIST, quiet: true });
run('git', ['commit', '-m', `Pubblicazione del ${new Date().toLocaleString('it-IT')}`], {
  cwd: DIST,
  quiet: true,
});
run('git', ['push', '--force', remote, `${BRANCH}:${BRANCH}`], { cwd: DIST });

fs.rmSync(path.join(DIST, '.git'), { recursive: true, force: true });

const owner = remote.replace(/^.*github\.com[:/]/, '').split('/')[0];
console.log(`\n✓ pubblicata su https://${owner.toLowerCase()}.github.io/${repoName}/`);
console.log('  GitHub impiega un minuto o due ad aggiornare il sito.\n');
