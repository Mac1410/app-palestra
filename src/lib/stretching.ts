/**
 * Coda di allungamento a fine allenamento.
 *
 * Due cose insieme, e la seconda è il motivo per cui vale la pena farla:
 *
 *  1. **I muscoli che hai usato oggi**, scelti guardando la seduta: dopo le
 *     gambe il quadricipite, dopo le spinte il pettorale, e così via.
 *  2. **Collo e spalle**, sempre. La gobba alla base del collo non nasce in
 *     palestra ma davanti a uno schermo: la testa va avanti, i pettorali e
 *     l'elevatore della scapola si accorciano, il tratto alto della schiena
 *     resta curvo e i flessori profondi del collo smettono di lavorare. Si
 *     allunga ciò che si è accorciato e si risveglia ciò che ha mollato.
 *
 * È una scelta dell'utente, non un'imposizione: si attiva dalle impostazioni.
 */

import { createId } from '@/lib/id';
import type { Exercise, MuscleGroup, SessionExercise } from '@/types';

/** Quanto dura una posizione, in secondi. */
const HOLD_SEC = 30;

/** Quanti allungamenti dedicati ai muscoli della seduta. */
const MUSCLE_SLOTS = 3;

/** Il blocco posturale, nell'ordine in cui ha senso farlo. */
const POSTURE_BLOCK = [
  'stretch-pettorali',
  'stretch-elevatore-scapola',
  'estensione-toracica',
  'retrazione-capo',
];

function toSessionExercise(exercise: Exercise): SessionExercise {
  return {
    id: createId('sex'),
    exerciseId: exercise.id,
    restSec: 0,
    targetReps: `${HOLD_SEC}s`,
    phase: 'stretching',
    sets: [
      {
        id: createId('set'),
        weight: 0,
        reps: HOLD_SEC,
        targetReps: HOLD_SEC,
        done: false,
      },
    ],
  };
}

/**
 * Costruisce la coda di defaticamento per una seduta.
 *
 * @param muscles i gruppi allenati oggi, dal più lavorato al meno
 * @param catalog il catalogo completo (compresi gli esercizi personalizzati)
 */
export function buildStretching(muscles: MuscleGroup[], catalog: Exercise[]): SessionExercise[] {
  const chosen: Exercise[] = [];
  const taken = new Set<string>();

  const take = (exercise: Exercise | undefined) => {
    if (!exercise || taken.has(exercise.id)) return;
    taken.add(exercise.id);
    chosen.push(exercise);
  };

  // 1. I muscoli della seduta, nell'ordine in cui sono stati allenati.
  for (const muscle of muscles) {
    if (chosen.length >= MUSCLE_SLOTS) break;
    take(
      catalog.find(
        (exercise) =>
          exercise.pattern === 'allungamento' &&
          !taken.has(exercise.id) &&
          (exercise.stretchFor ?? []).includes(muscle),
      ),
    );
  }

  // 2. Collo e spalle: sempre, a prescindere da cosa si è allenato.
  for (const id of POSTURE_BLOCK) {
    take(catalog.find((exercise) => exercise.id === id));
  }

  return chosen.map(toSessionExercise);
}

/** I gruppi muscolari della seduta, dal più presente al meno. */
export function sessionMuscles(
  exercises: { exerciseId: string }[],
  catalog: Exercise[],
): MuscleGroup[] {
  const counts = new Map<MuscleGroup, number>();

  for (const item of exercises) {
    const muscle = catalog.find((exercise) => exercise.id === item.exerciseId)?.muscle;
    if (!muscle || muscle === 'Cardio') continue;
    counts.set(muscle, (counts.get(muscle) ?? 0) + 1);
  }

  return [...counts.entries()].sort((a, b) => b[1] - a[1]).map(([muscle]) => muscle);
}

/** Minuti indicativi, per dirlo all'utente nelle impostazioni. */
export function stretchingMinutes(count: number): number {
  // Trenta secondi di posizione più il tempo di sistemarsi.
  return Math.round((count * (HOLD_SEC + 20)) / 60);
}
