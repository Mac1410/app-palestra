/**
 * Verifica le decisioni della progressione.
 *
 *   npm run check:progressione
 *
 * Ogni caso costruisce uno storico finto e controlla cosa il programma
 * propone la volta dopo: più carico, stesso carico con una ripetizione in più,
 * obiettivo abbassato, carico ridotto, o — a corpo libero — una variante più
 * dura o più facile.
 */

import process from 'node:process';

import { compila } from './lib/compila-ts.mjs';

const carica = compila(['src/lib/progression.ts', 'src/data/exercises.ts'], 'palestra-prova-progressione');
const { planExercise, RECENT_DAYS } = carica('lib/progression.js');
const { BUILTIN_EXERCISES } = carica('data/exercises.js');

const GIORNO = 24 * 60 * 60 * 1000;
const ORA = Date.UTC(2026, 9, 10);

const esercizio = (id) => BUILTIN_EXERCISES.find((item) => item.id === id);

/** Allenamento finto: un esercizio, N serie uguali. */
function seduta({ exerciseId, weight, reps, giorniFa, serie = 3, restSec = 120 }) {
  return {
    id: `s-${giorniFa}`,
    name: 'Prova',
    startedAt: ORA - giorniFa * GIORNO,
    endedAt: ORA - giorniFa * GIORNO,
    exercises: [
      {
        id: 'ex1',
        exerciseId,
        restSec,
        sets: Array.from({ length: serie }, (_, i) => ({
          id: `set-${i}`,
          weight,
          reps: Array.isArray(reps) ? reps[i] : reps,
          done: true,
        })),
      },
    ],
  };
}

const casi = [
  {
    nome: 'Prima volta: usa la proposta della scheda',
    exerciseId: 'panca-piana',
    target: { sets: 4, reps: '6-8', restSec: 150, weight: 40 },
    storico: [],
    atteso: { peso: 40, obiettivo: 6 },
  },
  {
    nome: 'Tutte le serie in cima all’intervallo: più carico',
    exerciseId: 'panca-piana',
    target: { sets: 4, reps: '6-8', restSec: 150, weight: 40 },
    storico: [seduta({ exerciseId: 'panca-piana', weight: 40, reps: 8, giorniFa: 3 })],
    atteso: { peso: 42.5, obiettivo: 6 },
  },
  {
    nome: 'Dentro l’intervallo: stesso carico, una ripetizione in più',
    exerciseId: 'panca-piana',
    target: { sets: 4, reps: '6-8', restSec: 150, weight: 40 },
    storico: [seduta({ exerciseId: 'panca-piana', weight: 40, reps: 7, giorniFa: 3 })],
    atteso: { peso: 40, obiettivo: 8 },
  },
  {
    nome: 'Sotto obiettivo una volta: obiettivo abbassato, carico invariato',
    exerciseId: 'panca-piana',
    target: { sets: 4, reps: '6-8', restSec: 150, weight: 40 },
    storico: [seduta({ exerciseId: 'panca-piana', weight: 40, reps: [6, 5, 4], giorniFa: 3 })],
    atteso: { peso: 40, obiettivo: 4 },
  },
  {
    nome: 'Sotto obiettivo due volte di fila: si toglie carico',
    exerciseId: 'panca-piana',
    target: { sets: 4, reps: '6-8', restSec: 150, weight: 40 },
    storico: [
      seduta({ exerciseId: 'panca-piana', weight: 40, reps: 4, giorniFa: 3 }),
      seduta({ exerciseId: 'panca-piana', weight: 40, reps: 5, giorniFa: 10 }),
    ],
    atteso: { peso: 35, obiettivo: 6 },
  },
  {
    nome: 'Manubri: gradino da un chilo sotto i venti',
    exerciseId: 'panca-piana-man',
    target: { sets: 4, reps: '8-10', restSec: 120, weight: 14 },
    storico: [seduta({ exerciseId: 'panca-piana-man', weight: 14, reps: 10, giorniFa: 2 })],
    atteso: { peso: 15, obiettivo: 8 },
  },
  {
    nome: 'Storico più vecchio di tre settimane: come la prima volta',
    exerciseId: 'panca-piana',
    target: { sets: 4, reps: '6-8', restSec: 150, weight: 40 },
    storico: [
      seduta({ exerciseId: 'panca-piana', weight: 60, reps: 8, giorniFa: RECENT_DAYS + 5 }),
    ],
    atteso: { peso: 40, obiettivo: 6 },
  },
  {
    nome: 'Corpo libero oltre l’obiettivo: variante più difficile',
    exerciseId: 'piegamenti',
    target: { sets: 3, reps: '8-12', restSec: 90 },
    storico: [seduta({ exerciseId: 'piegamenti', weight: 0, reps: 12, giorniFa: 4 })],
    atteso: { esercizio: 'piegamenti-diamante', obiettivo: 8 },
  },
  {
    nome: 'Corpo libero dentro l’intervallo: una ripetizione in più',
    exerciseId: 'piegamenti',
    target: { sets: 3, reps: '8-12', restSec: 90 },
    storico: [seduta({ exerciseId: 'piegamenti', weight: 0, reps: 9, giorniFa: 4 })],
    atteso: { esercizio: 'piegamenti', obiettivo: 10 },
  },
  {
    nome: 'Corpo libero molto sotto: variante più facile',
    exerciseId: 'piegamenti',
    target: { sets: 3, reps: '8-12', restSec: 90 },
    storico: [seduta({ exerciseId: 'piegamenti', weight: 0, reps: 4, giorniFa: 4 })],
    atteso: { esercizio: 'piegamenti-rialzati', obiettivo: 8 },
  },
  {
    nome: 'La scala si ricorda del cambio: si riparte dalla variante usata',
    exerciseId: 'piegamenti',
    target: { sets: 3, reps: '8-12', restSec: 90 },
    storico: [seduta({ exerciseId: 'piegamenti-diamante', weight: 0, reps: 9, giorniFa: 4 })],
    atteso: { esercizio: 'piegamenti-diamante', obiettivo: 10 },
  },
  {
    nome: 'Dimagrire: obiettivo raggiunto, si accorcia il recupero invece di caricare',
    goal: 'dimagrimento',
    exerciseId: 'panca-piana',
    target: { sets: 3, reps: '10-12', restSec: 60, weight: 30 },
    storico: [seduta({ exerciseId: 'panca-piana', weight: 30, reps: 12, giorniFa: 3, restSec: 60 })],
    atteso: { peso: 30, obiettivo: 12, recupero: 50 },
  },
  {
    nome: 'Dimagrire: col recupero già al minimo si allunga la serie',
    goal: 'dimagrimento',
    exerciseId: 'panca-piana',
    target: { sets: 3, reps: '10-12', restSec: 60, weight: 30 },
    storico: [seduta({ exerciseId: 'panca-piana', weight: 30, reps: 12, giorniFa: 3, restSec: 30 })],
    atteso: { peso: 30, obiettivo: 13, recupero: 30 },
  },
  {
    nome: 'Dimagrire: esaurito anche il margine, allora il carico sale',
    goal: 'dimagrimento',
    exerciseId: 'panca-piana',
    target: { sets: 3, reps: '10-12', restSec: 60, weight: 30 },
    storico: [seduta({ exerciseId: 'panca-piana', weight: 30, reps: 16, giorniFa: 3, restSec: 30 })],
    atteso: { peso: 32.5, obiettivo: 10 },
  },
  {
    nome: 'Dimagrire: sotto obiettivo con pause corte, tornano le pause',
    goal: 'dimagrimento',
    exerciseId: 'panca-piana',
    target: { sets: 3, reps: '10-12', restSec: 60, weight: 30 },
    storico: [seduta({ exerciseId: 'panca-piana', weight: 30, reps: 8, giorniFa: 3, restSec: 40 })],
    atteso: { peso: 30, obiettivo: 10, recupero: 50 },
  },
  {
    nome: 'Postura: il carico resta, cresce la ripetizione',
    goal: 'postura',
    exerciseId: 'panca-piana',
    target: { sets: 3, reps: '10-15', restSec: 45, weight: 25 },
    storico: [seduta({ exerciseId: 'panca-piana', weight: 25, reps: 15, giorniFa: 3, restSec: 45 })],
    atteso: { peso: 25, obiettivo: 16 },
  },
  {
    nome: 'Forza: obiettivo raggiunto, carico subito più alto',
    goal: 'forza',
    exerciseId: 'squat',
    target: { sets: 5, reps: '3-5', restSec: 180, weight: 60 },
    storico: [seduta({ exerciseId: 'squat', weight: 60, reps: 5, giorniFa: 3, restSec: 180 })],
    atteso: { peso: 62.5, obiettivo: 3 },
  },
  {
    nome: 'Esercizio a tempo: nessuna progressione di carico',
    exerciseId: 'plank',
    target: { sets: 3, reps: '40s', restSec: 45 },
    storico: [seduta({ exerciseId: 'plank', weight: 0, reps: 40, giorniFa: 3 })],
    atteso: { peso: 0, obiettivo: 40 },
  },
];

let errori = 0;

for (const caso of casi) {
  const piano = planExercise({
    exercise: esercizio(caso.exerciseId),
    catalog: BUILTIN_EXERCISES,
    target: caso.target,
    sessions: caso.storico,
    goal: caso.goal ?? 'massa',
    now: ORA,
  });

  const primaSerie = piano.sets[0];
  const esito = {
    esercizio: piano.exerciseId,
    peso: primaSerie.weight,
    obiettivo: primaSerie.targetReps,
    recupero: piano.restSec,
  };

  const problemi = Object.entries(caso.atteso)
    .filter(([chiave, valore]) => esito[chiave] !== valore)
    .map(([chiave, valore]) => `${chiave}: atteso ${valore}, ottenuto ${esito[chiave]}`);

  if (problemi.length > 0) errori++;

  console.log(`\n${problemi.length === 0 ? '✓' : '✗'} ${caso.nome}`);
  console.log(
    `    ${esito.esercizio} · ${esito.peso} kg × ${esito.obiettivo} · rec ${esito.recupero}s${
      piano.sets[piano.sets.length - 1].toFailure ? ' (ultima a cedimento)' : ''
    }`,
  );
  if (piano.advice) console.log(`    "${piano.advice}"`);
  problemi.forEach((problema) => console.log(`    ← ${problema}`));
}

console.log(
  errori === 0
    ? `\n✓ ${casi.length} casi su ${casi.length} corretti\n`
    : `\n✗ ${errori} casi sbagliati su ${casi.length}\n`,
);

if (errori > 0) process.exitCode = 1;
