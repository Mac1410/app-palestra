/**
 * Prova il generatore del programma su molte combinazioni di risposte.
 *
 *   npm run check:plan
 *
 * Non è un test unitario: stampa le schede che uscirebbero da quindici profili
 * diversi, così si leggono con gli occhi, e fallisce in automatico se trova
 * qualcosa di oggettivamente sbagliato — una seduta che sfora il tempo
 * dichiarato, un esercizio vietato dalle limitazioni, un attrezzo che a casa
 * non c'è, o un doppione nella stessa seduta.
 *
 * Il modulo è in TypeScript: viene compilato in una cartella temporanea e gli
 * alias "@/..." vengono riscritti in percorsi relativi per poterlo eseguire.
 */

import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import { createRequire } from 'node:module';
import os from 'node:os';
import path from 'node:path';
import process from 'node:process';

const ROOT = path.resolve(import.meta.dirname, '..');
const OUT = path.join(os.tmpdir(), 'palestra-prova-piani');

// --- compilazione ----------------------------------------------------------

const tsconfig = path.join(OUT, 'tsconfig.json');
fs.rmSync(OUT, { recursive: true, force: true });
fs.mkdirSync(OUT, { recursive: true });
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
        outDir: path.join(OUT, 'js'),
        types: [],
        // Percorsi assoluti: senza baseUrl, che TypeScript sta abbandonando.
        paths: { '@/*': [path.join(ROOT, 'src/*')] },
      },
      files: [path.join(ROOT, 'src/lib/plan.ts'), path.join(ROOT, 'src/data/exercises.ts')],
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

/** Gli alias "@/..." non esistono per Node: diventano percorsi relativi. */
function rewriteAliases(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const file = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      rewriteAliases(file);
      continue;
    }
    if (!file.endsWith('.js')) continue;
    const text = fs.readFileSync(file, 'utf8').replace(/require\("@\/([^"]+)"\)/g, (_, sub) => {
      let rel = path
        .relative(path.dirname(file), path.join(OUT, 'js', sub))
        .split(path.sep)
        .join('/');
      if (!rel.startsWith('.')) rel = `./${rel}`;
      return `require("${rel}")`;
    });
    fs.writeFileSync(file, text);
  }
}

rewriteAliases(path.join(OUT, 'js'));

const require = createRequire(import.meta.url);
const { buildProgram } = require(path.join(OUT, 'js/lib/plan.js'));
const { BUILTIN_EXERCISES } = require(path.join(OUT, 'js/data/exercises.js'));

// --- profili di prova ------------------------------------------------------

const base = {
  createdAt: Date.now(),
  updatedAt: Date.now(),
  experience: 'intermedio',
  goal: 'massa',
  focus: [],
  cardio: 'no',
  daysPerWeek: 3,
  sessionMinutes: 60,
  place: 'palestra',
  equipment: [],
  cautions: [],
  weightKg: 80,
};

const scenarios = [
  ['Massa, 3× 60min, palestra', {}],
  ['Massa, 6× 30min, palestra', { daysPerWeek: 6, sessionMinutes: 30 }],
  [
    'Forza, 4× 75min, avanzato',
    { goal: 'forza', daysPerWeek: 4, sessionMinutes: 75, experience: 'avanzato' },
  ],
  [
    'Dimagrire, 5× 45min, cardio molto',
    { goal: 'dimagrimento', daysPerWeek: 5, sessionMinutes: 45, cardio: 'molto' },
  ],
  ['Principiante, 2× 45min', { experience: 'principiante', daysPerWeek: 2, sessionMinutes: 45 }],
  ['Casa senza attrezzi, 4× 30min', { place: 'casa', daysPerWeek: 4, sessionMinutes: 30 }],
  ['Massa a casa senza attrezzi, 3× 45min', { place: 'casa', daysPerWeek: 3, sessionMinutes: 45 }],
  [
    'Dimagrire a casa senza attrezzi, 4× 40min',
    { place: 'casa', goal: 'dimagrimento', daysPerWeek: 4, sessionMinutes: 40 },
  ],
  [
    'Casa con manubri e panca, 3× 45min',
    { place: 'casa', equipment: ['manubri', 'panca'], sessionMinutes: 45 },
  ],
  [
    'Casa con elastici e sbarra, 3× 40min',
    { place: 'casa', equipment: ['elastici', 'sbarra'], sessionMinutes: 40 },
  ],
  ['Postura, 3× 45min', { goal: 'postura', sessionMinutes: 45 }],
  ['Schiena e spalle delicate', { cautions: ['schiena', 'spalla'] }],
  ['Ginocchia delicate, 4× 60min', { cautions: ['ginocchio'], daysPerWeek: 4 }],
  ['Priorità a glutei e dorso', { focus: ['Glutei', 'Dorso'], daysPerWeek: 4 }],
  ['Mantenimento, 1× 90min', { goal: 'mantenimento', daysPerWeek: 1, sessionMinutes: 90 }],
  ['Massa, 7× 45min', { daysPerWeek: 7, sessionMinutes: 45 }],
  ['Massa, 2× 45min', { daysPerWeek: 2, sessionMinutes: 45 }],
  ['Massa, 4× 45min', { daysPerWeek: 4, sessionMinutes: 45 }],
  ['Massa, 5× 40min', { daysPerWeek: 5, sessionMinutes: 40 }],
  ['Massa, 4× 75min', { daysPerWeek: 4, sessionMinutes: 75 }],
  ['Misto, principiante, 3× 60min', { place: 'misto', equipment: ['elastici'], experience: 'principiante' }],
];

const byId = new Map(BUILTIN_EXERCISES.map((exercise) => [exercise.id, exercise]));

/** Stessa stima del generatore, per controllare la durata prodotta. */
function minutesOf(item) {
  if (/min$/.test(item.reps)) return Number.parseInt(item.reps, 10) || 10;
  const work = /s$/.test(item.reps) ? 45 : 40;
  return (item.sets * (item.restSec + work) + 60) / 60;
}

const HOME_EQUIPMENT_FOR = {
  Manubri: 'manubri',
  Bilanciere: 'bilanciere',
  Kettlebell: 'kettlebell',
  Elastico: 'elastici',
};

const problems = [];

for (const [label, patch] of scenarios) {
  const profile = { ...base, ...patch };
  const { routines, program } = buildProgram(profile, BUILTIN_EXERCISES);

  console.log(`\n=== ${label} → ${program.split}`);

  for (const routine of routines) {
    const duration = routine.exercises.reduce((sum, item) => sum + minutesOf(item), 0);

    if (duration > profile.sessionMinutes + 2) {
      problems.push(`${label} · ${routine.name}: ${Math.round(duration)} minuti contro ${profile.sessionMinutes}`);
    }
    if (routine.exercises.length < 3) {
      problems.push(`${label} · ${routine.name}: solo ${routine.exercises.length} esercizi`);
    }

    console.log(`  ${routine.name.padEnd(12)} ${Math.round(duration)}′ / ${profile.sessionMinutes}′`);

    const seen = new Set();
    for (const item of routine.exercises) {
      const exercise = byId.get(item.exerciseId);
      console.log(`      ${exercise.name} ${item.sets}×${item.reps} · rec ${item.restSec}s`);

      if (seen.has(exercise.id)) {
        problems.push(`${label} · ${routine.name}: ${exercise.name} ripetuto`);
      }
      seen.add(exercise.id);

      const clash = (exercise.stress ?? []).filter((area) => profile.cautions.includes(area));
      if (clash.length > 0) {
        problems.push(`${label} · ${routine.name}: ${exercise.name} carica ${clash.join(', ')}`);
      }

      if (profile.place === 'casa') {
        const owned = new Set(profile.equipment);
        const needed = HOME_EQUIPMENT_FOR[exercise.equipment];
        if (needed ? !owned.has(needed) : !['Corpo libero'].includes(exercise.equipment)) {
          problems.push(
            `${label} · ${routine.name}: ${exercise.name} richiede ${exercise.equipment}`,
          );
        }
        for (const gear of exercise.gear ?? []) {
          if (!owned.has(gear)) {
            problems.push(`${label} · ${routine.name}: ${exercise.name} richiede ${gear}`);
          }
        }
      }
    }
  }
}

if (problems.length === 0) {
  console.log('\n✓ nessun problema su', scenarios.length, 'profili\n');
} else {
  console.log(`\n✗ ${problems.length} problemi:`);
  problems.forEach((problem) => console.log(`  - ${problem}`));
  process.exitCode = 1;
}
