/**
 * Progressione: che carico e quante ripetizioni proporre oggi.
 *
 * La regola è quella che si usa in palestra da sempre, la doppia progressione:
 * si resta sullo stesso carico finché non si chiudono tutte le serie in cima
 * all'intervallo di ripetizioni; allora si aggiunge peso e si riparte dal
 * fondo dell'intervallo. Se invece l'obiettivo non viene raggiunto, prima si
 * abbassa l'obiettivo di ripetizioni, e se succede due volte di fila si toglie
 * carico: insistere su un peso che non si muove non allena, logora.
 *
 * A corpo libero i chili non si possono aggiungere, quindi il carico si cambia
 * cambiando esercizio: ogni famiglia (piegamenti, trazioni, squat su una
 * gamba…) è una scala di difficoltà, e si sale o si scende di un gradino.
 *
 * Ma *come* si cresce dipende dall'obiettivo, e non è un dettaglio. Per la
 * forza il carico è il punto, e sale appena l'obiettivo è raggiunto. Per chi
 * vuole dimagrire no: lì serve uno sforzo ripetuto e continuo, quindi prima si
 * accorciano i recuperi e si allungano le serie, e il bilanciere si tocca solo
 * quando il corpo ha smesso di faticare. Per la postura e il mantenimento vale
 * lo stesso, con ancora meno fretta: caricare più del necessario aggiunge
 * rischio senza aggiungere risultato.
 *
 * Conta solo quello che è successo nelle ultime tre settimane: com'eri tre
 * mesi fa non dice più niente su che carico reggi oggi.
 */

import { workingSets } from '@/lib/stats';
import type { Exercise, Goal, Session, SetLog } from '@/types';

/** Finestra di osservazione: oltre, l'allenamento non racconta più il presente. */
export const RECENT_DAYS = 21;

const DAY_MS = 24 * 60 * 60 * 1000;

export type PlannedSet = {
  weight: number;
  targetReps: number;
  /** Ultima serie degli esercizi a corpo libero: si va a fondo e si conta. */
  toFailure?: boolean;
};

export type ExercisePlan = {
  /** Può differire dall'esercizio chiesto: a corpo libero si cambia variante. */
  exerciseId: string;
  sets: PlannedSet[];
  restSec: number;
  /** Intervallo di riferimento della scheda, es. "6-8". */
  targetReps?: string;
  /** Spiegazione della scelta, mostrata sotto il nome dell'esercizio. */
  advice?: string;
};

export type RepRange = { min: number; max: number; timed: boolean };

/**
 * Come si cresce, obiettivo per obiettivo.
 *
 *  - `carico`: raggiunto il tetto di ripetizioni si aggiunge peso.
 *  - `ripetizioni`: si allunga la serie e il peso resta dov'è, finché non si
 *    supera anche il margine; solo allora si aggiunge un gradino.
 *  - `densita`: si accorciano i recuperi a parità di carico — lo sforzo diventa
 *    più fitto senza diventare più pesante.
 */
type GrowthStyle = 'carico' | 'ripetizioni' | 'densita';

type Policy = {
  crescita: GrowthStyle;
  /** Ripetizioni concesse oltre il tetto prima di toccare il carico. */
  margine: number;
  /** Secondi tolti al recupero a ogni passo (solo per `densita`). */
  passoRecupero: number;
  /** Sotto questo recupero non si scende. */
  recuperoMinimo: number;
};

export const GROWTH_POLICY: Record<Goal, Policy> = {
  forza: { crescita: 'carico', margine: 0, passoRecupero: 0, recuperoMinimo: 120 },
  massa: { crescita: 'carico', margine: 0, passoRecupero: 0, recuperoMinimo: 60 },
  ricomposizione: { crescita: 'carico', margine: 2, passoRecupero: 0, recuperoMinimo: 45 },
  dimagrimento: { crescita: 'densita', margine: 4, passoRecupero: 10, recuperoMinimo: 30 },
  postura: { crescita: 'ripetizioni', margine: 4, passoRecupero: 0, recuperoMinimo: 45 },
  mantenimento: { crescita: 'ripetizioni', margine: 3, passoRecupero: 0, recuperoMinimo: 60 },
};

const DEFAULT_POLICY = GROWTH_POLICY.massa;

/** Legge "6-8", "10", "40s", "12 min". */
export function parseRange(reps: string | undefined): RepRange {
  if (!reps) return { min: 8, max: 12, timed: false };
  const timed = /s$/.test(reps.trim()) || /min$/.test(reps.trim());
  const numbers = reps.match(/\d+/g)?.map(Number) ?? [];
  if (numbers.length === 0) return { min: 8, max: 12, timed };
  const min = numbers[0];
  const max = numbers[1] ?? numbers[0];
  return { min, max, timed };
}

/** Il gradino di carico dipende dall'attrezzo: i manubri non fanno 2,5 kg. */
export function loadStep(exercise: Exercise, weight: number): number {
  if (exercise.equipment === 'Manubri' || exercise.equipment === 'Kettlebell') {
    return weight >= 20 ? 2 : 1;
  }
  if (exercise.equipment === 'Macchina' || exercise.equipment === 'Cavi') return 5;
  return 2.5;
}

function round(weight: number, step: number): number {
  return Math.max(0, Math.round(weight / step) * step);
}

/** Com'è andato un esercizio in una sessione: carico usato e serie riuscite. */
type Attempt = {
  exerciseId: string;
  at: number;
  weight: number;
  /** Ripetizioni della serie peggiore: l'obiettivo vale se lo reggono tutte. */
  worstReps: number;
  bestReps: number;
  sets: number;
  /** Recupero usato quella volta: serve a far crescere la densità. */
  restSec: number;
};

function attemptFrom(session: Session, exerciseIds: Set<string>): Attempt | null {
  const entries = session.exercises.filter((item) => exerciseIds.has(item.exerciseId));
  if (entries.length === 0) return null;

  const sets: SetLog[] = entries.flatMap((entry) => workingSets(entry));
  if (sets.length === 0) return null;

  const reps = sets.map((set) => set.reps);
  return {
    exerciseId: entries[0].exerciseId,
    at: session.endedAt ?? session.startedAt,
    restSec: entries[0].restSec,
    // Il carico di riferimento è il più usato nella seduta: la prima serie può
    // essere un avvicinamento e l'ultima un calo.
    weight: Math.max(...sets.map((set) => set.weight)),
    worstReps: Math.min(...reps),
    bestReps: Math.max(...reps),
    sets: sets.length,
  };
}

/** Gli esercizi della stessa scala di difficoltà, dal più facile al più duro. */
export function progressionLadder(exercise: Exercise, catalog: Exercise[]): Exercise[] {
  if (!exercise.progression) return [exercise];
  return catalog
    .filter((item) => item.progression?.family === exercise.progression?.family)
    .sort((a, b) => (a.progression?.level ?? 0) - (b.progression?.level ?? 0));
}

export type PlanOptions = {
  exercise: Exercise;
  catalog: Exercise[];
  /** Quello che chiede la scheda. */
  target: { sets: number; reps?: string; restSec: number; weight?: number };
  /** Storico completo: viene filtrato qui alle ultime tre settimane. */
  sessions: Session[];
  /** Decide se crescere di carico, di ripetizioni o di densità. */
  goal?: Goal;
  now?: number;
};

export function planExercise(options: PlanOptions): ExercisePlan {
  const { exercise, catalog, target, sessions } = options;
  const now = options.now ?? Date.now();
  const policy = options.goal ? GROWTH_POLICY[options.goal] : DEFAULT_POLICY;

  const range = parseRange(target.reps);
  const ladder = progressionLadder(exercise, catalog);
  const family = new Set(ladder.map((item) => item.id));

  // Solo le ultime tre settimane, e solo gli allenamenti conclusi.
  const recent = sessions
    .filter((session) => session.endedAt && now - session.endedAt <= RECENT_DAYS * DAY_MS)
    .sort((a, b) => (b.endedAt ?? 0) - (a.endedAt ?? 0));

  const attempts = recent
    .map((session) => attemptFrom(session, family))
    .filter((attempt) => attempt !== null);

  const build = (
    exerciseId: string,
    weight: number,
    targetReps: number,
    advice: string | undefined,
    bodyweight: boolean,
    restSec = target.restSec,
  ): ExercisePlan => ({
    exerciseId,
    restSec,
    targetReps: target.reps,
    advice,
    sets: Array.from({ length: Math.max(1, target.sets) }, (_, index) => ({
      weight,
      targetReps,
      // A corpo libero l'ultima serie si porta a cedimento: le ripetizioni che
      // escono lì sono l'unico modo di misurare se si è diventati più forti.
      toFailure: bodyweight && index === Math.max(1, target.sets) - 1,
    })),
  });

  const isBodyweight = exercise.equipment === 'Corpo libero' || exercise.equipment === 'Elastico';

  // Gli esercizi a tempo (plank, cardio) non seguono questa logica.
  if (range.timed || exercise.timed) {
    return {
      exerciseId: exercise.id,
      restSec: target.restSec,
      targetReps: target.reps,
      sets: Array.from({ length: Math.max(1, target.sets) }, () => ({
        weight: 0,
        targetReps: range.min,
      })),
    };
  }

  const last = attempts[0];

  if (!last) {
    return build(
      exercise.id,
      target.weight ?? 0,
      range.min,
      target.weight
        ? `Prima volta: ${target.weight} kg è una proposta da verificare, correggila senza problemi.`
        : 'Prima volta: scegli un carico che ti lasci un paio di ripetizioni di margine.',
      isBodyweight,
    );
  }

  const lastExercise = catalog.find((item) => item.id === last.exerciseId) ?? exercise;
  const lastName = lastExercise.name.toLowerCase();

  // --- esercizi a corpo libero: si cambia variante, non carico --------------
  if (isBodyweight && last.weight === 0) {
    const position = ladder.findIndex((item) => item.id === last.exerciseId);
    const harder = position >= 0 ? ladder[position + 1] : undefined;
    const easier = position > 0 ? ladder[position - 1] : undefined;

    const ceiling = range.max + policy.margine;

    if (last.worstReps >= ceiling && harder) {
      return build(
        harder.id,
        0,
        range.min,
        `Hai chiuso tutte le serie di ${lastName} a ${last.worstReps} ripetizioni: si sale di livello con ${harder.name.toLowerCase()}.`,
        true,
      );
    }

    if (last.worstReps >= range.max) {
      const next = last.worstReps + 1;
      return build(
        last.exerciseId,
        0,
        next,
        harder
          ? `Obiettivo alzato a ${next}: per il tuo obiettivo conta la ripetizione continua, non la difficoltà a tutti i costi.`
          : `Obiettivo alzato a ${next}: senza una variante più dura si cresce di ripetizioni.`,
        true,
      );
    }

    if (last.worstReps >= range.min) {
      const next = Math.min(range.max, last.worstReps + 1);
      return build(
        last.exerciseId,
        0,
        next,
        `Una ripetizione in più dell'ultima volta: obiettivo ${next}.`,
        true,
      );
    }

    // Sotto obiettivo: prima si scende di variante, se esiste.
    if (easier && last.worstReps < range.min - 2) {
      return build(
        easier.id,
        0,
        range.min,
        `${lastName} ti ha fermato a ${last.worstReps} ripetizioni: meglio costruirle con ${easier.name.toLowerCase()}.`,
        true,
      );
    }

    return build(
      last.exerciseId,
      0,
      Math.max(1, last.worstReps),
      `Obiettivo abbassato a ${Math.max(1, last.worstReps)}: l'ultima volta ti sei fermato lì.`,
      true,
    );
  }

  // --- esercizi con carico: doppia progressione ----------------------------
  const step = loadStep(exercise, last.weight);

  if (last.worstReps >= range.max) {
    const lastRest = last.restSec || target.restSec;

    // Densità: lo sforzo cresce accorciando le pause, non caricando il bilanciere.
    if (policy.crescita === 'densita' && lastRest > policy.recuperoMinimo) {
      const rest = Math.max(policy.recuperoMinimo, lastRest - policy.passoRecupero);
      return build(
        exercise.id,
        last.weight,
        range.max,
        `Stesso carico, recupero da ${rest} secondi invece di ${lastRest}: per dimagrire conta tenere alto lo sforzo, non alzare il peso.`,
        false,
        rest,
      );
    }

    // Ripetizioni: si allunga la serie finché resta margine.
    if (policy.crescita !== 'carico' && last.worstReps < range.max + policy.margine) {
      const next = last.worstReps + 1;
      return build(
        exercise.id,
        last.weight,
        next,
        `Obiettivo a ${next} ripetizioni, carico invariato: aumentarlo adesso non ti servirebbe.`,
        false,
        lastRest,
      );
    }

    const weight = round(last.weight + step, step);
    return build(
      exercise.id,
      weight,
      range.min,
      policy.crescita === 'carico'
        ? `Hai chiuso tutte le serie a ${last.worstReps} ripetizioni: si sale a ${weight} kg e si riparte da ${range.min}.`
        : `Anche con le serie lunghe e le pause corte non fatichi più: ora un gradino di carico serve davvero, ${weight} kg.`,
      false,
      policy.crescita === 'densita' ? lastRest : target.restSec,
    );
  }

  if (last.worstReps >= range.min) {
    const next = Math.min(range.max, last.worstReps + 1);
    return build(
      exercise.id,
      last.weight,
      next,
      `Stesso carico, una ripetizione in più: obiettivo ${next} per serie.`,
      false,
    );
  }

  // Se si è rimasti sotto per via delle pause accorciate, le pause tornano
  // prima di togliere carico: è la cosa meno costosa da restituire.
  if (
    policy.crescita === 'densita' &&
    last.restSec > 0 &&
    last.restSec < target.restSec &&
    last.worstReps < range.min
  ) {
    const rest = Math.min(target.restSec, last.restSec + policy.passoRecupero);
    return build(
      exercise.id,
      last.weight,
      range.min,
      `Recupero riportato a ${rest} secondi: le pause corte ti hanno fatto perdere ripetizioni, il carico resta lo stesso.`,
      false,
      rest,
    );
  }

  // Sotto obiettivo: due volte di fila sullo stesso peso e si alleggerisce.
  const previous = attempts[1];
  const failedTwice =
    previous && previous.weight >= last.weight && previous.worstReps < range.min;

  if (failedTwice) {
    const weight = round(last.weight * 0.9, step);
    return build(
      exercise.id,
      weight,
      range.min,
      `Due volte sotto obiettivo con ${last.weight} kg: si scende a ${weight} kg per ricostruire le ripetizioni.`,
      false,
    );
  }

  return build(
    exercise.id,
    last.weight,
    Math.max(1, last.worstReps),
    `L'ultima volta ti sei fermato a ${last.worstReps}: stesso carico e obiettivo ${Math.max(1, last.worstReps)}, poi si riprende a salire.`,
    false,
  );
}
