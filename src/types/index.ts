/** Modello dati dell'app. Tutto viene persistito in locale (AsyncStorage). */

export const MUSCLE_GROUPS = [
  'Petto',
  'Dorso',
  'Spalle',
  'Bicipiti',
  'Tricipiti',
  'Gambe',
  'Glutei',
  'Polpacci',
  'Addome',
  'Cardio',
] as const;

export type MuscleGroup = (typeof MUSCLE_GROUPS)[number];

export const EQUIPMENT = [
  'Bilanciere',
  'Manubri',
  'Macchina',
  'Cavi',
  'Corpo libero',
  'Kettlebell',
  'Elastico',
  'Cardio',
] as const;

export type Equipment = (typeof EQUIPMENT)[number];

export type Exercise = {
  id: string;
  name: string;
  muscle: MuscleGroup;
  equipment: Equipment;
  /** true per gli esercizi creati dall'utente (modificabili ed eliminabili). */
  custom?: boolean;
  notes?: string;
};

/** Riga di una scheda: esercizio + parametri obiettivo. */
export type RoutineExercise = {
  id: string;
  exerciseId: string;
  sets: number;
  /** Ripetizioni obiettivo, es. "8-12". */
  reps: string;
  /** Carico di partenza suggerito in kg. */
  weight?: number;
  restSec: number;
  note?: string;
};

export type Routine = {
  id: string;
  name: string;
  description?: string;
  exercises: RoutineExercise[];
  createdAt: number;
  updatedAt: number;
};

export type SetLog = {
  id: string;
  weight: number;
  reps: number;
  done: boolean;
  /** Le serie di riscaldamento non contano nel volume né nei record. */
  warmup?: boolean;
};

export type SessionExercise = {
  id: string;
  exerciseId: string;
  restSec: number;
  targetReps?: string;
  sets: SetLog[];
  note?: string;
};

export type Session = {
  id: string;
  routineId?: string;
  name: string;
  startedAt: number;
  /** Presente solo per le sessioni concluse. */
  endedAt?: number;
  exercises: SessionExercise[];
  notes?: string;
};

export type Settings = {
  /** Obiettivo di allenamenti a settimana. */
  weeklyGoal: number;
  /** Avvia il timer di recupero appena una serie viene completata. */
  autoRest: boolean;
  haptics: boolean;
  defaultRestSec: number;
};

export type GymState = {
  customExercises: Exercise[];
  routines: Routine[];
  sessions: Session[];
  /** Sessione in corso, non ancora salvata nello storico. */
  activeSession: Session | null;
  settings: Settings;
};

export const DEFAULT_SETTINGS: Settings = {
  weeklyGoal: 3,
  autoRest: true,
  haptics: true,
  defaultRestSec: 90,
};

export const EMPTY_STATE: GymState = {
  customExercises: [],
  routines: [],
  sessions: [],
  activeSession: null,
  settings: DEFAULT_SETTINGS,
};
