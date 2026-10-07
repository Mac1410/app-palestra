/**
 * Generatore del programma di allenamento.
 *
 * Prende le risposte del questionario e costruisce le schede: quante sedute,
 * come dividere il corpo, quali esercizi, con che serie, ripetizioni e recuperi.
 *
 * Il criterio di fondo è che una seduta equilibrata nasce dagli *schemi di
 * movimento* (spingere, tirare, accosciare, piegare l'anca, core), non dai
 * muscoli presi uno per uno. Le scelte seguono tre vincoli, in quest'ordine:
 *
 *  1. cosa si può fare davvero — attrezzatura disponibile e zone delicate;
 *  2. quanto tempo c'è — il programma taglia il superfluo per stare nei minuti;
 *  3. l'obiettivo — che decide serie, ripetizioni e recuperi.
 *
 * Il programma generato è un punto di partenza, non un vincolo: le schede
 * restano modificabili come tutte le altre.
 */

import { createId } from '@/lib/id';
import {
  type BodyArea,
  BODY_AREA_LABELS,
  type Equipment,
  type Exercise,
  type ExerciseRole,
  type Goal,
  GOAL_LABELS,
  type HomeEquipmentItem,
  type MovementPattern,
  type MuscleGroup,
  type Profile,
  type Program,
  type Routine,
  type RoutineExercise,
  type SplitKind,
} from '@/types';

// ---------------------------------------------------------------------------
// 1. Che cosa si può fare
// ---------------------------------------------------------------------------

/** Attrezzi utilizzabili, in base a dove ci si allena e a cosa si possiede. */
function availableEquipment(profile: Profile): Set<Equipment> {
  if (profile.place !== 'casa') {
    // In palestra (o misto, visto che in palestra ci si va comunque) c'è tutto.
    return new Set<Equipment>([
      'Bilanciere',
      'Manubri',
      'Macchina',
      'Cavi',
      'Corpo libero',
      'Kettlebell',
      'Elastico',
      'Cardio',
    ]);
  }

  const owned = new Set<HomeEquipmentItem>(profile.equipment);
  const equipment = new Set<Equipment>(['Corpo libero']);
  if (owned.has('manubri')) equipment.add('Manubri');
  if (owned.has('bilanciere')) equipment.add('Bilanciere');
  if (owned.has('kettlebell')) equipment.add('Kettlebell');
  if (owned.has('elastici')) equipment.add('Elastico');
  return equipment;
}

function canUse(exercise: Exercise, profile: Profile, equipment: Set<Equipment>): boolean {
  if (!equipment.has(exercise.equipment)) return false;

  if (profile.place === 'casa') {
    const owned = new Set<string>(profile.equipment);
    for (const gear of exercise.gear ?? []) {
      if (!owned.has(gear)) return false;
    }
  }

  return true;
}

function isSafe(exercise: Exercise, cautions: BodyArea[]): boolean {
  if (cautions.length === 0) return true;
  return !(exercise.stress ?? []).some((area) => cautions.includes(area));
}

// ---------------------------------------------------------------------------
// 2. Quanta roba, e di che tipo: lo decide l'obiettivo
// ---------------------------------------------------------------------------

type Scheme = { sets: number; reps: string; restSec: number };

const SCHEMES: Record<Goal, Record<ExerciseRole, Scheme>> = {
  forza: {
    fondamentale: { sets: 5, reps: '3-5', restSec: 180 },
    complementare: { sets: 3, reps: '6-8', restSec: 120 },
    isolamento: { sets: 3, reps: '8-12', restSec: 75 },
  },
  massa: {
    // Carichi alti e poche ripetizioni sui fondamentali, con recuperi pieni:
    // senza recupero il carico cala e la serie successiva non allena più.
    fondamentale: { sets: 4, reps: '6-8', restSec: 150 },
    complementare: { sets: 4, reps: '8-10', restSec: 120 },
    isolamento: { sets: 3, reps: '10-12', restSec: 75 },
  },
  ricomposizione: {
    fondamentale: { sets: 4, reps: '8-10', restSec: 90 },
    complementare: { sets: 3, reps: '10-12', restSec: 75 },
    isolamento: { sets: 3, reps: '12-15', restSec: 45 },
  },
  dimagrimento: {
    fondamentale: { sets: 3, reps: '10-12', restSec: 60 },
    complementare: { sets: 3, reps: '12-15', restSec: 45 },
    isolamento: { sets: 3, reps: '15-20', restSec: 30 },
  },
  postura: {
    fondamentale: { sets: 3, reps: '8-12', restSec: 75 },
    complementare: { sets: 3, reps: '10-15', restSec: 45 },
    isolamento: { sets: 2, reps: '12-15', restSec: 45 },
  },
  mantenimento: {
    fondamentale: { sets: 3, reps: '8-12', restSec: 90 },
    complementare: { sets: 3, reps: '10-12', restSec: 75 },
    isolamento: { sets: 2, reps: '12-15', restSec: 60 },
  },
};

/** Durate per gli esercizi che si misurano a tempo (plank, cardio, isometrie). */
function timedScheme(exercise: Exercise, goal: Goal): Scheme {
  if (exercise.pattern === 'cardio') {
    const minutes = goal === 'dimagrimento' ? 15 : 10;
    return { sets: 1, reps: `${minutes} min`, restSec: 0 };
  }
  const seconds = goal === 'forza' ? 30 : 40;
  return { sets: 3, reps: `${seconds}s`, restSec: 45 };
}

function schemeFor(exercise: Exercise, profile: Profile): Scheme {
  if (exercise.timed) return timedScheme(exercise, profile.goal);

  const role = exercise.role ?? 'complementare';
  const base = SCHEMES[profile.goal][role];
  let sets = base.sets;

  // Chi comincia fa meno serie sui fondamentali, chi è avanzato una in più.
  if (role === 'fondamentale') {
    if (profile.experience === 'principiante') sets = Math.max(3, sets - 1);
    if (profile.experience === 'avanzato') sets = Math.min(5, sets + 1);
  }

  // La mobilità si fa lenta e senza fretta, non a cedimento.
  if (exercise.pattern === 'mobilita') {
    return { sets: 2, reps: '8-10 lente', restSec: 30 };
  }

  return { ...base, sets };
}

// ---------------------------------------------------------------------------
// 3. Carico di partenza
// ---------------------------------------------------------------------------

/**
 * Proposta prudente per la prima volta, in frazioni del peso corporeo.
 * Serve solo a non partire da zero: la prima seduta è di fatto una prova, e
 * dalla seconda in poi contano i carichi che l'utente ha davvero usato.
 */
const LOAD_RATIO: Record<string, number> = {
  squat: 0.6,
  'front-squat': 0.45,
  pressa: 1.0,
  'hack-squat': 0.7,
  'goblet-squat': 0.2,
  'stacco-terra': 0.8,
  'stacco-rumeno': 0.55,
  'stacco-rumeno-man': 0.2,
  'hip-thrust': 0.7,
  'panca-piana': 0.5,
  'panca-inclinata-bil': 0.4,
  'panca-stretta': 0.4,
  'panca-piana-man': 0.18,
  'panca-inclinata-man': 0.15,
  'military-press': 0.33,
  'lento-avanti-man': 0.12,
  'rematore-bil': 0.45,
  'rematore-man': 0.18,
  'lat-machine': 0.5,
  pulley: 0.5,
  'curl-bilanciere': 0.22,
  'curl-manubri': 0.08,
  'curl-martello': 0.08,
  affondi: 0.12,
  'bulgarian-split': 0.1,
};

const EXPERIENCE_FACTOR = { principiante: 0.65, intermedio: 1, avanzato: 1.2 } as const;

function startingWeight(exercise: Exercise, profile: Profile): number | undefined {
  const ratio = LOAD_RATIO[exercise.id];
  if (!ratio || !profile.weightKg) return undefined;

  const raw = profile.weightKg * ratio * EXPERIENCE_FACTOR[profile.experience];
  // Bilancieri e macchine salgono di 2,5 kg; manubri e kettlebell di 1 kg.
  const step = exercise.equipment === 'Manubri' || exercise.equipment === 'Kettlebell' ? 1 : 2.5;
  return Math.max(step, Math.round(raw / step) * step);
}

// ---------------------------------------------------------------------------
// 4. La suddivisione: quante sedute e come dividerle
// ---------------------------------------------------------------------------

type Slot = {
  /** Schemi di movimento accettati, in ordine di preferenza. */
  patterns: MovementPattern[];
  role: ExerciseRole;
  muscles?: MuscleGroup[];
  /** I primi slot sono il cuore della seduta; gli ultimi si tagliano se manca tempo. */
  optional?: boolean;
};

type Blueprint = {
  name: string;
  focus: string;
  slots: Slot[];
  /** Riserve pescate solo se avanza tempo, coerenti con il tema della seduta. */
  extras: Slot[];
};

const CORE_EXTRA: Slot = { patterns: ['core'], role: 'complementare' };

const PUSH_EXTRAS: Slot[] = [
  { patterns: ['isolamento'], role: 'isolamento', muscles: ['Petto'] },
  { patterns: ['isolamento'], role: 'isolamento', muscles: ['Tricipiti'] },
  { patterns: ['isolamento'], role: 'isolamento', muscles: ['Spalle'] },
  CORE_EXTRA,
];

const PULL_EXTRAS: Slot[] = [
  { patterns: ['isolamento'], role: 'isolamento', muscles: ['Dorso'] },
  { patterns: ['isolamento'], role: 'isolamento', muscles: ['Bicipiti'] },
  { patterns: ['isolamento', 'mobilita'], role: 'complementare', muscles: ['Spalle'] },
  CORE_EXTRA,
];

const LEGS_EXTRAS: Slot[] = [
  { patterns: ['isolamento'], role: 'isolamento', muscles: ['Gambe'] },
  { patterns: ['isolamento'], role: 'isolamento', muscles: ['Glutei'] },
  { patterns: ['isolamento'], role: 'isolamento', muscles: ['Polpacci'] },
  CORE_EXTRA,
];

const UPPER_EXTRAS: Slot[] = [
  { patterns: ['isolamento'], role: 'isolamento', muscles: ['Dorso', 'Petto'] },
  { patterns: ['isolamento'], role: 'isolamento', muscles: ['Bicipiti', 'Tricipiti'] },
  { patterns: ['isolamento', 'mobilita'], role: 'complementare', muscles: ['Spalle'] },
  CORE_EXTRA,
];

const LOWER_EXTRAS: Slot[] = [
  { patterns: ['isolamento'], role: 'isolamento', muscles: ['Gambe', 'Glutei'] },
  { patterns: ['cerniera', 'affondo'], role: 'complementare' },
  { patterns: ['isolamento'], role: 'isolamento', muscles: ['Polpacci'] },
  CORE_EXTRA,
];

const GENERAL_EXTRAS: Slot[] = [
  CORE_EXTRA,
  { patterns: ['isolamento'], role: 'isolamento', muscles: ['Bicipiti', 'Tricipiti', 'Spalle'] },
  { patterns: ['isolamento'], role: 'isolamento', muscles: ['Gambe', 'Glutei', 'Polpacci'] },
  { patterns: ['mobilita'], role: 'complementare' },
];

const POSTURE_EXTRAS: Slot[] = [
  { patterns: ['mobilita'], role: 'complementare' },
  CORE_EXTRA,
  { patterns: ['isolamento', 'mobilita'], role: 'complementare', muscles: ['Spalle', 'Dorso'] },
];

const CIRCUIT_EXTRAS: Slot[] = [
  CORE_EXTRA,
  { patterns: ['cardio'], role: 'complementare' },
  { patterns: ['isolamento'], role: 'isolamento' },
];

const PUSH_SLOTS: Slot[] = [
  { patterns: ['spinta-orizzontale'], role: 'fondamentale' },
  { patterns: ['spinta-verticale'], role: 'fondamentale' },
  { patterns: ['spinta-orizzontale'], role: 'complementare' },
  { patterns: ['isolamento'], role: 'isolamento', muscles: ['Spalle'] },
  { patterns: ['isolamento', 'spinta-orizzontale'], role: 'isolamento', muscles: ['Tricipiti'] },
  { patterns: ['isolamento'], role: 'isolamento', muscles: ['Petto'], optional: true },
];

const PULL_SLOTS: Slot[] = [
  { patterns: ['trazione-verticale'], role: 'fondamentale' },
  { patterns: ['trazione-orizzontale'], role: 'fondamentale' },
  { patterns: ['trazione-orizzontale', 'trazione-verticale'], role: 'complementare' },
  { patterns: ['isolamento', 'mobilita'], role: 'complementare', muscles: ['Spalle'] },
  { patterns: ['isolamento'], role: 'isolamento', muscles: ['Bicipiti'] },
  { patterns: ['isolamento'], role: 'isolamento', muscles: ['Bicipiti'], optional: true },
];

const LEGS_SLOTS: Slot[] = [
  { patterns: ['squat'], role: 'fondamentale' },
  { patterns: ['cerniera'], role: 'fondamentale' },
  { patterns: ['affondo'], role: 'complementare' },
  { patterns: ['isolamento'], role: 'isolamento', muscles: ['Gambe', 'Glutei'] },
  { patterns: ['isolamento'], role: 'isolamento', muscles: ['Polpacci'], optional: true },
  { patterns: ['core'], role: 'complementare', optional: true },
];

const UPPER_A_SLOTS: Slot[] = [
  { patterns: ['spinta-orizzontale'], role: 'fondamentale' },
  { patterns: ['trazione-verticale'], role: 'fondamentale' },
  { patterns: ['spinta-verticale'], role: 'complementare' },
  { patterns: ['trazione-orizzontale'], role: 'complementare' },
  { patterns: ['isolamento'], role: 'isolamento', muscles: ['Bicipiti'] },
  { patterns: ['isolamento', 'spinta-orizzontale'], role: 'isolamento', muscles: ['Tricipiti'] },
  { patterns: ['isolamento', 'mobilita'], role: 'complementare', muscles: ['Spalle'], optional: true },
];

const UPPER_B_SLOTS: Slot[] = [
  { patterns: ['trazione-orizzontale'], role: 'fondamentale' },
  { patterns: ['spinta-verticale'], role: 'fondamentale' },
  { patterns: ['trazione-verticale'], role: 'complementare' },
  { patterns: ['spinta-orizzontale'], role: 'complementare' },
  { patterns: ['isolamento'], role: 'isolamento', muscles: ['Spalle'] },
  { patterns: ['isolamento'], role: 'isolamento', muscles: ['Bicipiti', 'Tricipiti'] },
  { patterns: ['core'], role: 'complementare', optional: true },
];

const LOWER_A_SLOTS: Slot[] = [
  { patterns: ['squat'], role: 'fondamentale' },
  { patterns: ['cerniera'], role: 'fondamentale' },
  { patterns: ['affondo'], role: 'complementare' },
  { patterns: ['isolamento'], role: 'isolamento', muscles: ['Gambe'] },
  { patterns: ['isolamento'], role: 'isolamento', muscles: ['Polpacci'], optional: true },
  { patterns: ['core'], role: 'complementare', optional: true },
];

const LOWER_B_SLOTS: Slot[] = [
  { patterns: ['cerniera'], role: 'fondamentale' },
  { patterns: ['squat'], role: 'fondamentale' },
  { patterns: ['isolamento'], role: 'isolamento', muscles: ['Glutei'] },
  { patterns: ['isolamento'], role: 'isolamento', muscles: ['Gambe'] },
  { patterns: ['core'], role: 'complementare' },
  { patterns: ['isolamento'], role: 'isolamento', muscles: ['Polpacci'], optional: true },
];

/**
 * Sedute per gruppo muscolare: poche zone per volta, ma lavorate davvero.
 * È la risposta giusta quando l'obiettivo è la massa e il tempo per seduta è
 * poco: concentrare tutto su un gruppo permette comunque tre o quattro
 * esercizi mirati, cosa impossibile in un full body di quarantacinque minuti.
 */
const CHEST_DAY: Slot[] = [
  { patterns: ['spinta-orizzontale'], role: 'fondamentale' },
  { patterns: ['spinta-orizzontale'], role: 'complementare' },
  { patterns: ['isolamento'], role: 'isolamento', muscles: ['Petto'] },
  { patterns: ['isolamento'], role: 'isolamento', muscles: ['Petto'], optional: true },
  { patterns: ['isolamento', 'spinta-orizzontale'], role: 'isolamento', muscles: ['Tricipiti'] },
  { patterns: ['isolamento'], role: 'isolamento', muscles: ['Tricipiti'], optional: true },
];

const BACK_DAY: Slot[] = [
  { patterns: ['trazione-verticale'], role: 'fondamentale' },
  { patterns: ['trazione-orizzontale'], role: 'fondamentale' },
  { patterns: ['trazione-orizzontale', 'trazione-verticale'], role: 'complementare' },
  { patterns: ['isolamento'], role: 'isolamento', muscles: ['Dorso'], optional: true },
  { patterns: ['isolamento'], role: 'isolamento', muscles: ['Bicipiti'] },
  { patterns: ['isolamento'], role: 'isolamento', muscles: ['Bicipiti'], optional: true },
];

const LEG_DAY: Slot[] = [
  { patterns: ['squat'], role: 'fondamentale' },
  { patterns: ['cerniera'], role: 'fondamentale' },
  { patterns: ['affondo'], role: 'complementare' },
  { patterns: ['isolamento'], role: 'isolamento', muscles: ['Gambe'] },
  { patterns: ['isolamento'], role: 'isolamento', muscles: ['Gambe', 'Glutei'], optional: true },
  { patterns: ['isolamento'], role: 'isolamento', muscles: ['Polpacci'], optional: true },
];

const SHOULDER_DAY: Slot[] = [
  { patterns: ['spinta-verticale'], role: 'fondamentale' },
  { patterns: ['spinta-verticale'], role: 'complementare' },
  { patterns: ['isolamento'], role: 'isolamento', muscles: ['Spalle'] },
  { patterns: ['isolamento'], role: 'isolamento', muscles: ['Spalle'], optional: true },
  { patterns: ['isolamento', 'mobilita'], role: 'complementare', muscles: ['Spalle'] },
  { patterns: ['core'], role: 'complementare', optional: true },
];

const ARM_DAY: Slot[] = [
  { patterns: ['isolamento'], role: 'isolamento', muscles: ['Bicipiti'] },
  { patterns: ['isolamento', 'spinta-orizzontale'], role: 'complementare', muscles: ['Tricipiti'] },
  { patterns: ['isolamento'], role: 'isolamento', muscles: ['Bicipiti'] },
  { patterns: ['isolamento'], role: 'isolamento', muscles: ['Tricipiti'] },
  { patterns: ['isolamento'], role: 'isolamento', muscles: ['Spalle'], optional: true },
  { patterns: ['core'], role: 'complementare', optional: true },
];

const CHEST_EXTRAS: Slot[] = [
  { patterns: ['isolamento'], role: 'isolamento', muscles: ['Petto'] },
  { patterns: ['isolamento'], role: 'isolamento', muscles: ['Tricipiti'] },
  { patterns: ['spinta-orizzontale'], role: 'complementare' },
  CORE_EXTRA,
];

const BACK_EXTRAS: Slot[] = [
  { patterns: ['isolamento'], role: 'isolamento', muscles: ['Dorso'] },
  { patterns: ['isolamento'], role: 'isolamento', muscles: ['Bicipiti'] },
  { patterns: ['trazione-orizzontale', 'trazione-verticale'], role: 'complementare' },
  CORE_EXTRA,
];

const SHOULDER_EXTRAS: Slot[] = [
  { patterns: ['isolamento'], role: 'isolamento', muscles: ['Spalle'] },
  { patterns: ['isolamento', 'mobilita'], role: 'complementare', muscles: ['Spalle'] },
  CORE_EXTRA,
];

const ARM_EXTRAS: Slot[] = [
  { patterns: ['isolamento'], role: 'isolamento', muscles: ['Bicipiti'] },
  { patterns: ['isolamento'], role: 'isolamento', muscles: ['Tricipiti'] },
  { patterns: ['isolamento'], role: 'isolamento', muscles: ['Spalle'] },
  CORE_EXTRA,
];

function fullBodySlots(variant: 'A' | 'B' | 'C'): Slot[] {
  const common: Slot[] = [{ patterns: ['core'], role: 'complementare', optional: true }];

  if (variant === 'A') {
    return [
      { patterns: ['squat'], role: 'fondamentale' },
      { patterns: ['spinta-orizzontale'], role: 'fondamentale' },
      { patterns: ['trazione-orizzontale'], role: 'fondamentale' },
      { patterns: ['spinta-verticale'], role: 'complementare', optional: true },
      { patterns: ['isolamento'], role: 'isolamento', muscles: ['Bicipiti'], optional: true },
      ...common,
    ];
  }
  if (variant === 'B') {
    return [
      { patterns: ['cerniera'], role: 'fondamentale' },
      { patterns: ['spinta-verticale'], role: 'fondamentale' },
      { patterns: ['trazione-verticale'], role: 'fondamentale' },
      { patterns: ['affondo'], role: 'complementare', optional: true },
      { patterns: ['isolamento'], role: 'isolamento', muscles: ['Tricipiti'], optional: true },
      ...common,
    ];
  }
  return [
    { patterns: ['affondo', 'squat'], role: 'fondamentale' },
    { patterns: ['spinta-orizzontale'], role: 'fondamentale' },
    { patterns: ['trazione-verticale', 'trazione-orizzontale'], role: 'fondamentale' },
    { patterns: ['cerniera'], role: 'complementare', optional: true },
    { patterns: ['isolamento'], role: 'isolamento', muscles: ['Spalle'], optional: true },
    ...common,
  ];
}

function circuitSlots(variant: 'A' | 'B'): Slot[] {
  if (variant === 'A') {
    return [
      { patterns: ['squat'], role: 'fondamentale' },
      { patterns: ['spinta-orizzontale'], role: 'fondamentale' },
      { patterns: ['cerniera'], role: 'complementare' },
      { patterns: ['core'], role: 'complementare' },
      { patterns: ['cardio'], role: 'complementare', optional: true },
    ];
  }
  return [
    { patterns: ['affondo'], role: 'fondamentale' },
    { patterns: ['trazione-orizzontale', 'trazione-verticale'], role: 'fondamentale' },
    { patterns: ['spinta-verticale', 'spinta-orizzontale'], role: 'complementare' },
    { patterns: ['core'], role: 'complementare' },
    { patterns: ['cardio'], role: 'complementare', optional: true },
  ];
}

/** Sedute dedicate a schiena e postura, quando l'obiettivo è quello. */
function postureSlots(variant: 'A' | 'B'): Slot[] {
  const base: Slot[] = [
    { patterns: ['mobilita'], role: 'complementare' },
    { patterns: ['core'], role: 'complementare' },
  ];
  if (variant === 'A') {
    return [
      ...base,
      { patterns: ['cerniera'], role: 'fondamentale' },
      { patterns: ['trazione-orizzontale'], role: 'fondamentale' },
      { patterns: ['squat'], role: 'complementare' },
      { patterns: ['core'], role: 'complementare', optional: true },
    ];
  }
  return [
    ...base,
    { patterns: ['trazione-verticale', 'trazione-orizzontale'], role: 'fondamentale' },
    { patterns: ['spinta-orizzontale'], role: 'complementare' },
    { patterns: ['affondo', 'squat'], role: 'complementare' },
    { patterns: ['isolamento', 'mobilita'], role: 'complementare', muscles: ['Spalle'], optional: true },
  ];
}

/**
 * Sceglie la suddivisione.
 *
 * Contano due cose insieme. La prima è aritmetica: tante sedute brevi
 * significano poco tempo per volta, quindi conviene dividere il corpo in parti
 * più piccole; poche sedute lunghe chiedono il contrario.
 *
 * La seconda è l'obiettivo, e pesa quanto la prima. Per la massa servono
 * carichi alti, recuperi pieni e più esercizi sullo stesso gruppo: roba che in
 * un full body di quarantacinque minuti non ci sta: o si tagliano i recuperi,
 * e allora il carico crolla, o si tocca ogni gruppo con un esercizio solo. Per
 * questo chi punta alla massa viene sempre diviso, fino alla divisione per
 * gruppo muscolare quando le sedute sono corte e frequenti. La forza fa il
 * percorso opposto: pochi movimenti, ripetuti spesso, quindi full body finché
 * i giorni lo consentono.
 */
export function chooseSplit(profile: Profile): SplitKind {
  const { daysPerWeek, sessionMinutes, place, goal } = profile;

  // A casa senza attrezzi il lavoro a carico naturale si organizza a circuito.
  const equipment = availableEquipment(profile);
  const onlyBodyweight = equipment.size === 1 && equipment.has('Corpo libero');
  if (onlyBodyweight && place === 'casa') return 'circuito';

  // Sotto l'ora, una seduta non regge più di due gruppi muscolari fatti bene.
  const shortSession = sessionMinutes < 60;

  if (goal === 'massa') {
    if (daysPerWeek <= 2) {
      // Con due sole sedute il full body ha senso solo se sono lunghe.
      return sessionMinutes >= 75 ? 'full-body' : 'upper-lower';
    }
    if (daysPerWeek === 3) return 'push-pull-legs';
    if (daysPerWeek === 4) return shortSession ? 'per-gruppo' : 'upper-lower';
    if (daysPerWeek === 5) return 'per-gruppo';
    // Sei o sette giorni: ogni gruppo due volte a settimana.
    return 'push-pull-legs';
  }

  if (goal === 'forza') {
    // I fondamentali rendono con la frequenza, non con la frammentazione.
    if (daysPerWeek <= 3) return sessionMinutes <= 40 ? 'push-pull-legs' : 'full-body';
    if (daysPerWeek === 4) return 'upper-lower';
    return 'push-pull-legs';
  }

  if (daysPerWeek <= 2) return 'full-body';
  if (daysPerWeek === 3) return shortSession && goal === 'ricomposizione' ? 'push-pull-legs' : 'full-body';
  if (daysPerWeek === 4) return 'upper-lower';
  if (daysPerWeek === 5) return 'push-pull-legs-upper-lower';
  return 'push-pull-legs';
}

/** Le sedute della settimana, nell'ordine in cui ruotano. */
function blueprints(split: SplitKind, profile: Profile): Blueprint[] {
  const days = profile.daysPerWeek;

  if (profile.goal === 'postura' && days <= 3) {
    return [
      {
        name: 'Postura A',
        focus: 'Catena posteriore, core e mobilità',
        slots: postureSlots('A'),
        extras: POSTURE_EXTRAS,
      },
      {
        name: 'Postura B',
        focus: 'Spalle, trazioni e stabilità',
        slots: postureSlots('B'),
        extras: POSTURE_EXTRAS,
      },
    ].slice(0, Math.max(2, days));
  }

  switch (split) {
    case 'circuito':
      return [
        {
          name: 'Circuito A',
          focus: 'Gambe, spinta e core',
          slots: circuitSlots('A'),
          extras: CIRCUIT_EXTRAS,
        },
        {
          name: 'Circuito B',
          focus: 'Trazioni, affondi e core',
          slots: circuitSlots('B'),
          extras: CIRCUIT_EXTRAS,
        },
      ];

    case 'full-body': {
      const variants: ('A' | 'B' | 'C')[] = days <= 2 ? ['A', 'B'] : ['A', 'B', 'C'];
      return variants.map((variant) => ({
        name: `Full body ${variant}`,
        focus: 'Tutto il corpo in una seduta',
        slots: fullBodySlots(variant),
        extras: GENERAL_EXTRAS,
      }));
    }

    case 'upper-lower': {
      const upperLower: Blueprint[] = [
        {
          name: 'Upper A',
          focus: 'Parte alta: spinte e trazioni',
          slots: UPPER_A_SLOTS,
          extras: UPPER_EXTRAS,
        },
        {
          name: 'Lower A',
          focus: 'Parte bassa: accosciata e anca',
          slots: LOWER_A_SLOTS,
          extras: LOWER_EXTRAS,
        },
        {
          name: 'Upper B',
          focus: 'Parte alta: trazioni e spinte sopra la testa',
          slots: UPPER_B_SLOTS,
          extras: UPPER_EXTRAS,
        },
        {
          name: 'Lower B',
          focus: 'Parte bassa: anca e glutei',
          slots: LOWER_B_SLOTS,
          extras: LOWER_EXTRAS,
        },
      ];
      // Con due o tre sedute a settimana le varianti B tornerebbero una volta
      // ogni quindici giorni: meglio due schede sole, ripetute più spesso.
      return days <= 3 ? upperLower.slice(0, 2) : upperLower;
    }

    case 'push-pull-legs':
      return [
        { name: 'Push', focus: 'Petto, spalle e tricipiti', slots: PUSH_SLOTS, extras: PUSH_EXTRAS },
        { name: 'Pull', focus: 'Dorso e bicipiti', slots: PULL_SLOTS, extras: PULL_EXTRAS },
        { name: 'Legs', focus: 'Gambe, glutei e core', slots: LEGS_SLOTS, extras: LEGS_EXTRAS },
      ];

    case 'per-gruppo':
      // Quattro giorni: le braccia restano attaccate al loro gruppo di spinta
      // o di tirata; dal quinto in poi hanno una seduta tutta loro.
      return days >= 5
        ? [
            { name: 'Petto', focus: 'Tutto sul petto', slots: CHEST_DAY, extras: CHEST_EXTRAS },
            { name: 'Dorso', focus: 'Tutto sulla schiena', slots: BACK_DAY, extras: BACK_EXTRAS },
            { name: 'Gambe', focus: 'Cosce, glutei e polpacci', slots: LEG_DAY, extras: LEGS_EXTRAS },
            { name: 'Spalle', focus: 'Spalle e stabilità', slots: SHOULDER_DAY, extras: SHOULDER_EXTRAS },
            { name: 'Braccia', focus: 'Bicipiti e tricipiti', slots: ARM_DAY, extras: ARM_EXTRAS },
          ]
        : [
            {
              name: 'Petto e tricipiti',
              focus: 'Spinte e braccia distese',
              slots: CHEST_DAY,
              extras: CHEST_EXTRAS,
            },
            {
              name: 'Dorso e bicipiti',
              focus: 'Tirate e braccia flesse',
              slots: BACK_DAY,
              extras: BACK_EXTRAS,
            },
            { name: 'Gambe', focus: 'Cosce, glutei e polpacci', slots: LEG_DAY, extras: LEGS_EXTRAS },
            {
              name: 'Spalle e core',
              focus: 'Spalle, deltoidi e tronco',
              slots: SHOULDER_DAY,
              extras: SHOULDER_EXTRAS,
            },
          ];

    case 'push-pull-legs-upper-lower':
      return [
        { name: 'Push', focus: 'Petto, spalle e tricipiti', slots: PUSH_SLOTS, extras: PUSH_EXTRAS },
        { name: 'Pull', focus: 'Dorso e bicipiti', slots: PULL_SLOTS, extras: PULL_EXTRAS },
        { name: 'Legs', focus: 'Gambe, glutei e core', slots: LEGS_SLOTS, extras: LEGS_EXTRAS },
        {
          name: 'Upper',
          focus: 'Richiamo sulla parte alta',
          slots: UPPER_B_SLOTS,
          extras: UPPER_EXTRAS,
        },
        {
          name: 'Lower',
          focus: 'Richiamo su gambe e glutei',
          slots: LOWER_B_SLOTS,
          extras: LOWER_EXTRAS,
        },
      ];
  }
}

// ---------------------------------------------------------------------------
// 5. Scelta degli esercizi
// ---------------------------------------------------------------------------

/** Preferenza di attrezzo: chi comincia sta meglio su macchine e manubri. */
function equipmentScore(equipment: Equipment, profile: Profile): number {
  const order: Record<Profile['experience'], Equipment[]> = {
    principiante: ['Macchina', 'Manubri', 'Corpo libero', 'Elastico', 'Cavi', 'Kettlebell', 'Bilanciere', 'Cardio'],
    intermedio: ['Bilanciere', 'Manubri', 'Macchina', 'Cavi', 'Corpo libero', 'Kettlebell', 'Elastico', 'Cardio'],
    avanzato: ['Bilanciere', 'Manubri', 'Cavi', 'Corpo libero', 'Macchina', 'Kettlebell', 'Elastico', 'Cardio'],
  };
  const index = order[profile.experience].indexOf(equipment);
  return index === -1 ? 0 : (8 - index) * 2;
}

type Picker = {
  profile: Profile;
  pool: Exercise[];
  /** Quante volte un esercizio è già stato usato nell'intero programma. */
  used: Map<string, number>;
  /** Esercizi già presenti nella seduta in costruzione: mai due volte. */
  session: Set<string>;
};

function pick(slot: Slot, picker: Picker): Exercise | undefined {
  const { profile, pool, used, session } = picker;

  const candidates = pool.filter((exercise) => {
    if (session.has(exercise.id)) return false;
    if (!exercise.pattern || !slot.patterns.includes(exercise.pattern)) return false;
    if (slot.muscles && !slot.muscles.includes(exercise.muscle)) return false;
    return true;
  });

  if (candidates.length === 0) return undefined;

  const scored = candidates.map((exercise) => {
    let score = equipmentScore(exercise.equipment, profile);

    // Il ruolo chiesto dallo slot conta più di ogni altra cosa.
    if (exercise.role === slot.role) score += 30;
    else if (slot.role === 'fondamentale' && exercise.role === 'complementare') score += 10;
    else if (slot.role === 'isolamento' && exercise.role === 'complementare') score += 8;

    // I muscoli a cui l'utente tiene di più hanno la precedenza.
    if (profile.focus.includes(exercise.muscle)) score += 12;

    // Varietà: un esercizio già inserito nel programma viene penalizzato.
    score -= (used.get(exercise.id) ?? 0) * 25;

    // Chi vuole dimagrire o fare postura preferisce movimenti a basso carico.
    if (profile.goal === 'postura' && exercise.pattern === 'mobilita') score += 10;

    return { exercise, score };
  });

  scored.sort((a, b) => b.score - a.score);
  const chosen = scored[0].exercise;
  used.set(chosen.id, (used.get(chosen.id) ?? 0) + 1);
  session.add(chosen.id);
  return chosen;
}

// ---------------------------------------------------------------------------
// 6. Stare nei minuti a disposizione
// ---------------------------------------------------------------------------

/** Minuti stimati per un esercizio: serie per (recupero + tempo di lavoro). */
function estimateMinutes(scheme: Scheme): number {
  if (/min$/.test(scheme.reps)) return Number.parseInt(scheme.reps, 10) || 10;

  const workSec = /s$/.test(scheme.reps) ? 45 : 40;
  const setup = 60;
  return (scheme.sets * (scheme.restSec + workSec) + setup) / 60;
}

type PlannedItem = { exercise: Exercise; scheme: Scheme; optional: boolean };

const MIN_EXERCISES = 3;

/**
 * Fa stare la seduta nel tempo dichiarato.
 *
 * Le rinunce seguono un ordine preciso, perché non tutte costano uguale:
 * prima si tolgono i complementi, poi si limano le serie, poi i recuperi (ma
 * mai sotto una soglia, altrimenti l'allenamento cambia natura), e solo alla
 * fine si toglie un esercizio vero. Sotto i tre esercizi non si scende: una
 * seduta più corta del previsto è meglio di una seduta smontata.
 */
function fitToTime(planned: PlannedItem[], budget: number, profile: Profile): PlannedItem[] {
  const items = planned.map((item) => ({ ...item, scheme: { ...item.scheme } }));
  const total = () => items.reduce((sum, item) => sum + estimateMinutes(item.scheme), 0);

  // Dieci minuti di tolleranza in percentuale: il tempo è una stima, non un cronometro.
  const limit = budget * 1.1;

  // Sotto questa soglia i recuperi non scendono, o l'allenamento cambia natura.
  const restFloor = profile.goal === 'forza' ? 120 : profile.goal === 'massa' ? 60 : 30;

  const minSets = (item: PlannedItem) => (item.exercise.role === 'fondamentale' ? 3 : 2);

  let guard = 60;
  while (total() > limit && guard-- > 0) {
    const lastOptional = items.map((item) => item.optional).lastIndexOf(true);
    if (lastOptional !== -1) {
      items.splice(lastOptional, 1);
      continue;
    }

    // Si lima partendo dal fondo: in coda stanno i complementi, in testa i
    // movimenti che danno senso alla seduta.
    const trimmable = [...items].reverse().find((item) => item.scheme.sets > minSets(item));
    if (trimmable) {
      trimmable.scheme.sets -= 1;
      continue;
    }

    const restable = [...items].reverse().find((item) => item.scheme.restSec > restFloor);
    if (restable) {
      restable.scheme.restSec = Math.max(restFloor, restable.scheme.restSec - 15);
      continue;
    }

    if (items.length > MIN_EXERCISES) {
      items.pop();
      continue;
    }

    break;
  }

  return items;
}

/**
 * Riempie il tempo rimasto.
 *
 * Succede quando le limitazioni hanno escluso interi movimenti (chi ha le
 * ginocchia delicate perde tutti gli accosciamenti) o quando si hanno sedute
 * molto lunghe: senza questo, la scheda finirebbe a metà del tempo dichiarato.
 */
function topUp(
  items: PlannedItem[],
  budget: number,
  picker: Picker,
  profile: Profile,
  extras: Slot[],
  maxPerMuscle: number,
): void {
  const total = () => items.reduce((sum, item) => sum + estimateMinutes(item.scheme), 0);
  const countFor = (muscle: string) =>
    items.filter((item) => item.exercise.muscle === muscle).length;

  // Due passate: con sedute lunghe una sola lista di riserve non basta a
  // coprire il tempo disponibile.
  for (const slot of [...extras, ...extras]) {
    // Sotto gli otto minuti liberi non vale la pena aggiungere altro.
    if (budget - total() < 8) return;

    const exercise = pick(slot, picker);
    if (!exercise) continue;

    // Quanto si può insistere su un gruppo dipende da come è fatta la seduta:
    // in una giornata dedicata al petto quattro esercizi sono il punto, in un
    // full body sarebbero accanimento.
    if (countFor(exercise.muscle) >= maxPerMuscle) continue;

    const scheme = schemeFor(exercise, profile);
    if (total() + estimateMinutes(scheme) > budget) continue;
    items.push({ exercise, scheme, optional: true });
  }
}

// ---------------------------------------------------------------------------
// 7. Montaggio del programma
// ---------------------------------------------------------------------------

export type GeneratedProgram = { routines: Routine[]; program: Program };

export function buildProgram(profile: Profile, catalog: Exercise[]): GeneratedProgram {
  const equipment = availableEquipment(profile);

  const usable = catalog.filter((exercise) => canUse(exercise, profile, equipment));
  const safe = usable.filter((exercise) => isSafe(exercise, profile.cautions));

  // Se le limitazioni svuotano il catalogo di un movimento, meglio avere
  // comunque qualcosa in lista che lasciare la seduta monca.
  const pool = safe.length >= 12 ? safe : usable;

  const split = chooseSplit(profile);
  const sessions = blueprints(split, profile);
  const used = new Map<string, number>();
  const picker: Picker = { profile, pool, used, session: new Set<string>() };

  // Il tempo utile è al netto di riscaldamento e cambi d'attrezzo.
  const budget = Math.max(15, profile.sessionMinutes - 8);
  const now = Date.now();

  const routines: Routine[] = sessions.map((blueprint, index) => {
    picker.session = new Set<string>();
    const planned: PlannedItem[] = [];

    const add = (slot: Slot) => {
      const exercise = pick(slot, picker);
      if (!exercise) return undefined;
      const item: PlannedItem = {
        exercise,
        scheme: schemeFor(exercise, profile),
        optional: !!slot.optional,
      };
      planned.push(item);
      return item;
    };

    blueprint.slots.forEach(add);

    // Il cardio, se richiesto, si prenota il suo tempo prima che se lo mangino
    // i pesi: altrimenti è sempre la prima cosa a saltare.
    const wantsCardio =
      split !== 'circuito' &&
      (profile.cardio === 'molto' ||
        (profile.cardio === 'poco' && index % 2 === 0) ||
        (profile.goal === 'dimagrimento' && profile.cardio !== 'no'));

    const cardioMinutes = wantsCardio ? (profile.goal === 'dimagrimento' ? 15 : 10) : 0;
    const liftingBudget = budget - cardioMinutes;

    const items = fitToTime(planned, liftingBudget, profile);
    // Più il programma è diviso, più si insiste sullo stesso gruppo.
    const maxPerMuscle = split === 'per-gruppo' ? 4 : profile.goal === 'massa' ? 3 : 2;
    topUp(items, liftingBudget, picker, profile, blueprint.extras, maxPerMuscle);

    if (wantsCardio) {
      const cardio = pick({ patterns: ['cardio'], role: 'complementare' }, picker);
      if (cardio) {
        items.push({
          exercise: cardio,
          scheme: { sets: 1, reps: `${cardioMinutes} min`, restSec: 0 },
          optional: false,
        });
      }
    }

    return {
      id: createId('routine'),
      name: blueprint.name,
      description: blueprint.focus,
      exercises: items.map((item) => ({
        id: createId('rex'),
        exerciseId: item.exercise.id,
        sets: item.scheme.sets,
        reps: item.scheme.reps,
        restSec: item.scheme.restSec,
        weight: startingWeight(item.exercise, profile),
      })),
      createdAt: now + index,
      updatedAt: now + index,
      generated: true,
    };
  });

  return {
    program: {
      id: createId('program'),
      createdAt: now,
      split,
      routineIds: routines.map((routine) => routine.id),
      rationale: explain(profile, split, routines),
    },
    routines,
  };
}

// ---------------------------------------------------------------------------
// 8. Spiegare le scelte
// ---------------------------------------------------------------------------

const GOAL_EXPLANATION: Record<Goal, string> = {
  massa: 'serie da 6 a 12 ripetizioni e recuperi medi, il terreno dove il muscolo cresce',
  forza: 'poche ripetizioni e recuperi lunghi, perché la forza chiede carichi alti e lucidità',
  dimagrimento: 'più ripetizioni e recuperi brevi, per tenere alto il dispendio',
  ricomposizione: 'ripetizioni medie e recuperi contenuti, una via di mezzo fra muscolo e dispendio',
  postura: 'carichi moderati, molto controllo e lavoro di mobilità',
  mantenimento: 'volumi moderati, senza eccessi, per restare in forma con costanza',
};

function explain(profile: Profile, split: SplitKind, routines: Routine[]): string[] {
  const reasons: string[] = [];

  const sessionWord = profile.daysPerWeek === 1 ? 'volta' : 'volte';

  const splitReason: Record<SplitKind, string> = {
    'full-body': 'con poche sedute conviene toccare tutto il corpo ogni volta.',
    circuito: 'senza attrezzi il lavoro rende di più organizzato a circuito.',
    'upper-lower': 'separare la parte alta dalla parte bassa lascia a ogni zona il tempo che merita.',
    'push-pull-legs': 'dividere per spinte, tirate e gambe permette più lavoro su ogni zona senza allungare la seduta.',
    'push-pull-legs-upper-lower':
      'cinque sedute permettono il giro completo più due richiami sulle zone che ne hanno bisogno.',
    'per-gruppo':
      'sedute corte e frequenti rendono di più dedicate a un gruppo per volta: tre o quattro esercizi mirati stanno in mezz’ora, un full body no.',
  };

  reasons.push(
    `Ti alleni ${profile.daysPerWeek} ${sessionWord} a settimana per circa ${profile.sessionMinutes} minuti: ` +
      splitReason[split],
  );

  if (profile.goal === 'massa') {
    reasons.push(
      'Per la massa il programma non propone mai sedute per tutto il corpo: servono carichi alti, recuperi pieni fra le serie e più di un esercizio per gruppo, e in una seduta sola non ci starebbero.',
    );
  }

  reasons.push(
    `Obiettivo "${GOAL_LABELS[profile.goal].title.toLowerCase()}": ${GOAL_EXPLANATION[profile.goal]}.`,
  );

  if (profile.cautions.length > 0) {
    reasons.push(
      `Hai segnalato attenzione a ${profile.cautions
        .map((area) => BODY_AREA_LABELS[area])
        .join(', ')}: gli esercizi che caricano queste zone sono stati esclusi e sostituiti.`,
    );
  }

  if (profile.place === 'casa') {
    reasons.push(
      profile.equipment.length > 0
        ? `A casa con ${profile.equipment.join(', ')}: la scelta degli esercizi tiene conto solo di quello che hai.`
        : 'A casa senza attrezzi: tutti gli esercizi sono a corpo libero.',
    );
  }

  if (profile.place === 'casa' && !profile.equipment.includes('sbarra')) {
    reasons.push(
      'Senza una sbarra per trazioni il lavoro di tirata resta limitato: un elastico o una sbarra da porta aprirebbero parecchi esercizi in più.',
    );
  }

  if (profile.focus.length > 0) {
    reasons.push(`Hai dato la precedenza a ${profile.focus.join(', ')}: trovi più lavoro su quei gruppi.`);
  }

  const shortest = Math.min(...routines.map((routine) => routine.exercises.length));
  if (shortest <= MIN_EXERCISES && profile.sessionMinutes <= 45) {
    reasons.push(
      `In ${profile.sessionMinutes} minuti ci sta l'essenziale: poche cose fatte bene, senza correre fra un esercizio e l'altro.`,
    );
  }

  const totalSets = routines.reduce(
    (sum, routine) => sum + routine.exercises.reduce((inner, e) => inner + e.sets, 0),
    0,
  );
  reasons.push(
    `Ne escono ${routines.length} sedute diverse, ${totalSets} serie in tutto, da ruotare nell'ordine in cui le trovi.`,
  );

  return reasons;
}
