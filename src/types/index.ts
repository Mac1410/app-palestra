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

/**
 * Schema di movimento. Serve al generatore del programma: una scheda
 * equilibrata nasce scegliendo movimenti diversi, non muscoli diversi.
 */
export const MOVEMENT_PATTERNS = [
  'spinta-orizzontale',
  'spinta-verticale',
  'trazione-verticale',
  'trazione-orizzontale',
  'squat',
  'cerniera',
  'affondo',
  'core',
  'isolamento',
  'mobilita',
  'cardio',
] as const;

export type MovementPattern = (typeof MOVEMENT_PATTERNS)[number];

/** Peso dell'esercizio nella seduta: i fondamentali vengono per primi. */
export type ExerciseRole = 'fondamentale' | 'complementare' | 'isolamento';

/** Zone del corpo da trattare con cura, dichiarate nel questionario. */
export const BODY_AREAS = ['schiena', 'spalla', 'ginocchio', 'anca', 'gomito', 'polso'] as const;

export type BodyArea = (typeof BODY_AREAS)[number];

/** Come si chiamano in italiano corrente, al plurale dove serve. */
export const BODY_AREA_LABELS: Record<BodyArea, string> = {
  schiena: 'schiena',
  spalla: 'spalle',
  ginocchio: 'ginocchia',
  anca: 'anche',
  gomito: 'gomiti',
  polso: 'polsi',
};

/** Attrezzatura che a casa può esserci o non esserci (in palestra c'è tutto). */
export const HOME_GEAR = ['sbarra', 'panca', 'parallele'] as const;

export type HomeGear = (typeof HOME_GEAR)[number];

export type Exercise = {
  id: string;
  name: string;
  muscle: MuscleGroup;
  equipment: Equipment;
  /** true per gli esercizi creati dall'utente (modificabili ed eliminabili). */
  custom?: boolean;
  notes?: string;
  /** Da qui in giù: informazioni usate dal generatore del programma. */
  pattern?: MovementPattern;
  role?: ExerciseRole;
  /** Zone sollecitate: chi le ha dichiarate delicate non riceve l'esercizio. */
  stress?: BodyArea[];
  /** Attrezzi indispensabili oltre a quello principale (sbarra, panca…). */
  gear?: HomeGear[];
  /** Misurato in secondi anziché in ripetizioni (plank, cardio). */
  timed?: boolean;
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
  /** true se la scheda nasce dal programma generato dal questionario. */
  generated?: boolean;
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

// ---------------------------------------------------------------------------
// Profilo: le risposte del questionario iniziale.
// Sono le cose che cambiano di rado (obiettivo, disponibilità, limiti) e che
// restano valide nel tempo; come ti stai allenando davvero lo dicono invece
// gli allenamenti recenti.
// ---------------------------------------------------------------------------

export const GOALS = [
  'massa',
  'forza',
  'dimagrimento',
  'ricomposizione',
  'postura',
  'mantenimento',
] as const;

export type Goal = (typeof GOALS)[number];

export const GOAL_LABELS: Record<Goal, { title: string; description: string }> = {
  massa: { title: 'Mettere massa', description: 'Aumentare il volume muscolare' },
  forza: { title: 'Diventare più forte', description: 'Alzare carichi più alti' },
  dimagrimento: { title: 'Dimagrire', description: 'Perdere grasso mantenendo il muscolo' },
  ricomposizione: {
    title: 'Ricomposizione',
    description: 'Un po’ più muscolo, un po’ meno grasso',
  },
  postura: { title: 'Postura e mobilità', description: 'Schiena, equilibrio, articolazioni' },
  mantenimento: { title: 'Mantenermi in forma', description: 'Restare attivo senza strafare' },
};

export const EXPERIENCE_LEVELS = ['principiante', 'intermedio', 'avanzato'] as const;

export type ExperienceLevel = (typeof EXPERIENCE_LEVELS)[number];

export const TRAINING_PLACES = ['palestra', 'casa', 'misto'] as const;

export type TrainingPlace = (typeof TRAINING_PLACES)[number];

/** Attrezzatura disponibile a casa. In palestra si dà per scontato tutto. */
export const HOME_EQUIPMENT = [
  'manubri',
  'bilanciere',
  'kettlebell',
  'elastici',
  'sbarra',
  'panca',
  'parallele',
] as const;

export type HomeEquipmentItem = (typeof HOME_EQUIPMENT)[number];

export const CARDIO_PREFERENCES = ['no', 'poco', 'molto'] as const;

export type CardioPreference = (typeof CARDIO_PREFERENCES)[number];

export type Profile = {
  /** Quando il questionario è stato compilato la prima volta. */
  createdAt: number;
  updatedAt: number;

  // Chi sei
  age?: number;
  weightKg?: number;
  heightCm?: number;
  experience: ExperienceLevel;

  // Cosa vuoi
  goal: Goal;
  focus: MuscleGroup[];
  cardio: CardioPreference;

  // Quando e dove
  daysPerWeek: number;
  sessionMinutes: number;
  place: TrainingPlace;
  equipment: HomeEquipmentItem[];

  // Di cosa tenere conto
  cautions: BodyArea[];
};

/** Suddivisione scelta dal programma in base al questionario. */
export const SPLIT_KINDS = [
  'full-body',
  'upper-lower',
  'push-pull-legs',
  'push-pull-legs-upper-lower',
  'circuito',
] as const;

export type SplitKind = (typeof SPLIT_KINDS)[number];

export const SPLIT_LABELS: Record<SplitKind, string> = {
  'full-body': 'Full body',
  'upper-lower': 'Upper / Lower',
  'push-pull-legs': 'Push / Pull / Legs',
  'push-pull-legs-upper-lower': 'Push / Pull / Legs + Upper / Lower',
  circuito: 'Circuito a corpo libero',
};

/** Il programma generato: quali schede, in che ordine ruotano, e perché. */
export type Program = {
  id: string;
  createdAt: number;
  split: SplitKind;
  /** Schede del programma, nell'ordine in cui vanno ruotate. */
  routineIds: string[];
  /** Spiegazione in italiano delle scelte fatte, mostrata all'utente. */
  rationale: string[];
};

export type GymState = {
  /** null finché il questionario iniziale non è stato compilato. */
  profile: Profile | null;
  program: Program | null;
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
  profile: null,
  program: null,
  customExercises: [],
  routines: [],
  sessions: [],
  activeSession: null,
  settings: DEFAULT_SETTINGS,
};
