import type { Exercise } from '@/types';

/**
 * Catalogo di base, sempre disponibile e non modificabile.
 * Gli esercizi creati dall'utente vivono nello store (`customExercises`).
 */
export const BUILTIN_EXERCISES: Exercise[] = [
  // Petto
  { id: 'panca-piana', name: 'Panca piana', muscle: 'Petto', equipment: 'Bilanciere' },
  { id: 'panca-inclinata-bil', name: 'Panca inclinata bilanciere', muscle: 'Petto', equipment: 'Bilanciere' },
  { id: 'panca-piana-man', name: 'Panca piana manubri', muscle: 'Petto', equipment: 'Manubri' },
  { id: 'panca-inclinata-man', name: 'Panca inclinata manubri', muscle: 'Petto', equipment: 'Manubri' },
  { id: 'croci-panca', name: 'Croci su panca', muscle: 'Petto', equipment: 'Manubri' },
  { id: 'croci-cavi', name: 'Croci ai cavi', muscle: 'Petto', equipment: 'Cavi' },
  { id: 'chest-press', name: 'Chest press', muscle: 'Petto', equipment: 'Macchina' },
  { id: 'pectoral-machine', name: 'Pectoral machine', muscle: 'Petto', equipment: 'Macchina' },
  { id: 'piegamenti', name: 'Piegamenti sulle braccia', muscle: 'Petto', equipment: 'Corpo libero' },
  { id: 'dip-petto', name: 'Dip alle parallele', muscle: 'Petto', equipment: 'Corpo libero' },

  // Dorso
  { id: 'trazioni', name: 'Trazioni alla sbarra', muscle: 'Dorso', equipment: 'Corpo libero' },
  { id: 'lat-machine', name: 'Lat machine avanti', muscle: 'Dorso', equipment: 'Macchina' },
  { id: 'pulley', name: 'Pulley basso', muscle: 'Dorso', equipment: 'Cavi' },
  { id: 'rematore-bil', name: 'Rematore con bilanciere', muscle: 'Dorso', equipment: 'Bilanciere' },
  { id: 'rematore-man', name: 'Rematore con manubrio', muscle: 'Dorso', equipment: 'Manubri' },
  { id: 'rematore-macchina', name: 'Rematore alla macchina', muscle: 'Dorso', equipment: 'Macchina' },
  { id: 'pullover-cavi', name: 'Pullover ai cavi', muscle: 'Dorso', equipment: 'Cavi' },
  { id: 'stacco-terra', name: 'Stacco da terra', muscle: 'Dorso', equipment: 'Bilanciere' },
  { id: 'stacco-rumeno', name: 'Stacco rumeno', muscle: 'Dorso', equipment: 'Bilanciere' },
  { id: 'iperestensioni', name: 'Iperestensioni', muscle: 'Dorso', equipment: 'Corpo libero' },

  // Spalle
  { id: 'military-press', name: 'Military press', muscle: 'Spalle', equipment: 'Bilanciere' },
  { id: 'lento-avanti-man', name: 'Lento avanti manubri', muscle: 'Spalle', equipment: 'Manubri' },
  { id: 'shoulder-press', name: 'Shoulder press', muscle: 'Spalle', equipment: 'Macchina' },
  { id: 'alzate-laterali', name: 'Alzate laterali', muscle: 'Spalle', equipment: 'Manubri' },
  { id: 'alzate-laterali-cavi', name: 'Alzate laterali ai cavi', muscle: 'Spalle', equipment: 'Cavi' },
  { id: 'alzate-frontali', name: 'Alzate frontali', muscle: 'Spalle', equipment: 'Manubri' },
  { id: 'alzate-90', name: 'Alzate a 90 gradi', muscle: 'Spalle', equipment: 'Manubri' },
  { id: 'face-pull', name: 'Face pull', muscle: 'Spalle', equipment: 'Cavi' },
  { id: 'scrollate', name: 'Scrollate', muscle: 'Spalle', equipment: 'Manubri' },

  // Bicipiti
  { id: 'curl-bilanciere', name: 'Curl con bilanciere', muscle: 'Bicipiti', equipment: 'Bilanciere' },
  { id: 'curl-manubri', name: 'Curl con manubri', muscle: 'Bicipiti', equipment: 'Manubri' },
  { id: 'curl-martello', name: 'Curl a martello', muscle: 'Bicipiti', equipment: 'Manubri' },
  { id: 'curl-panca-45', name: 'Curl su panca inclinata', muscle: 'Bicipiti', equipment: 'Manubri' },
  { id: 'curl-scott', name: 'Curl alla panca Scott', muscle: 'Bicipiti', equipment: 'Bilanciere' },
  { id: 'curl-cavi', name: 'Curl ai cavi', muscle: 'Bicipiti', equipment: 'Cavi' },

  // Tricipiti
  { id: 'french-press', name: 'French press', muscle: 'Tricipiti', equipment: 'Bilanciere' },
  { id: 'push-down', name: 'Push down ai cavi', muscle: 'Tricipiti', equipment: 'Cavi' },
  { id: 'push-down-corda', name: 'Push down con corda', muscle: 'Tricipiti', equipment: 'Cavi' },
  { id: 'estensioni-sopra-testa', name: 'Estensioni sopra la testa', muscle: 'Tricipiti', equipment: 'Manubri' },
  { id: 'panca-stretta', name: 'Panca presa stretta', muscle: 'Tricipiti', equipment: 'Bilanciere' },
  { id: 'dip-tricipiti', name: 'Dip tra panche', muscle: 'Tricipiti', equipment: 'Corpo libero' },

  // Gambe
  { id: 'squat', name: 'Squat con bilanciere', muscle: 'Gambe', equipment: 'Bilanciere' },
  { id: 'front-squat', name: 'Front squat', muscle: 'Gambe', equipment: 'Bilanciere' },
  { id: 'pressa', name: 'Pressa 45 gradi', muscle: 'Gambe', equipment: 'Macchina' },
  { id: 'affondi', name: 'Affondi', muscle: 'Gambe', equipment: 'Manubri' },
  { id: 'bulgarian-split', name: 'Bulgarian split squat', muscle: 'Gambe', equipment: 'Manubri' },
  { id: 'leg-extension', name: 'Leg extension', muscle: 'Gambe', equipment: 'Macchina' },
  { id: 'leg-curl', name: 'Leg curl', muscle: 'Gambe', equipment: 'Macchina' },
  { id: 'hack-squat', name: 'Hack squat', muscle: 'Gambe', equipment: 'Macchina' },
  { id: 'goblet-squat', name: 'Goblet squat', muscle: 'Gambe', equipment: 'Kettlebell' },

  // Glutei
  { id: 'hip-thrust', name: 'Hip thrust', muscle: 'Glutei', equipment: 'Bilanciere' },
  { id: 'glute-bridge', name: 'Ponte per glutei', muscle: 'Glutei', equipment: 'Corpo libero' },
  { id: 'abduzioni-macchina', name: 'Abduzioni alla macchina', muscle: 'Glutei', equipment: 'Macchina' },
  { id: 'kickback-cavi', name: 'Kickback ai cavi', muscle: 'Glutei', equipment: 'Cavi' },

  // Polpacci
  { id: 'calf-in-piedi', name: 'Calf in piedi', muscle: 'Polpacci', equipment: 'Macchina' },
  { id: 'calf-seduto', name: 'Calf da seduto', muscle: 'Polpacci', equipment: 'Macchina' },
  { id: 'calf-pressa', name: 'Calf alla pressa', muscle: 'Polpacci', equipment: 'Macchina' },

  // Addome
  { id: 'crunch', name: 'Crunch', muscle: 'Addome', equipment: 'Corpo libero' },
  { id: 'crunch-cavi', name: 'Crunch ai cavi', muscle: 'Addome', equipment: 'Cavi' },
  { id: 'plank', name: 'Plank', muscle: 'Addome', equipment: 'Corpo libero' },
  { id: 'leg-raise', name: 'Leg raise alla sbarra', muscle: 'Addome', equipment: 'Corpo libero' },
  { id: 'russian-twist', name: 'Russian twist', muscle: 'Addome', equipment: 'Corpo libero' },
  { id: 'ab-wheel', name: 'Ab wheel', muscle: 'Addome', equipment: 'Corpo libero' },

  // Cardio
  { id: 'tapis-roulant', name: 'Tapis roulant', muscle: 'Cardio', equipment: 'Cardio' },
  { id: 'cyclette', name: 'Cyclette', muscle: 'Cardio', equipment: 'Cardio' },
  { id: 'vogatore', name: 'Vogatore', muscle: 'Cardio', equipment: 'Cardio' },
  { id: 'ellittica', name: 'Ellittica', muscle: 'Cardio', equipment: 'Cardio' },
  { id: 'corda', name: 'Corda', muscle: 'Cardio', equipment: 'Cardio' },
];

/** Schede di esempio create al primo avvio. */
export const STARTER_ROUTINES: {
  name: string;
  description: string;
  exercises: { exerciseId: string; sets: number; reps: string; restSec: number }[];
}[] = [
  {
    name: 'Full body A',
    description: 'Allenamento completo, 3 volte a settimana',
    exercises: [
      { exerciseId: 'squat', sets: 4, reps: '6-8', restSec: 150 },
      { exerciseId: 'panca-piana', sets: 4, reps: '6-8', restSec: 150 },
      { exerciseId: 'rematore-bil', sets: 4, reps: '8-10', restSec: 120 },
      { exerciseId: 'lento-avanti-man', sets: 3, reps: '10-12', restSec: 90 },
      { exerciseId: 'plank', sets: 3, reps: '45s', restSec: 60 },
    ],
  },
  {
    name: 'Push',
    description: 'Petto, spalle e tricipiti',
    exercises: [
      { exerciseId: 'panca-inclinata-bil', sets: 4, reps: '8-10', restSec: 120 },
      { exerciseId: 'chest-press', sets: 3, reps: '10-12', restSec: 90 },
      { exerciseId: 'lento-avanti-man', sets: 4, reps: '8-10', restSec: 120 },
      { exerciseId: 'alzate-laterali', sets: 4, reps: '12-15', restSec: 60 },
      { exerciseId: 'push-down-corda', sets: 3, reps: '12-15', restSec: 60 },
    ],
  },
  {
    name: 'Pull',
    description: 'Dorso e bicipiti',
    exercises: [
      { exerciseId: 'trazioni', sets: 4, reps: '6-10', restSec: 150 },
      { exerciseId: 'rematore-man', sets: 4, reps: '10-12', restSec: 90 },
      { exerciseId: 'pulley', sets: 3, reps: '10-12', restSec: 90 },
      { exerciseId: 'curl-bilanciere', sets: 3, reps: '10-12', restSec: 60 },
      { exerciseId: 'curl-martello', sets: 3, reps: '12-15', restSec: 60 },
    ],
  },
  {
    name: 'Legs',
    description: 'Gambe e glutei',
    exercises: [
      { exerciseId: 'squat', sets: 4, reps: '6-8', restSec: 180 },
      { exerciseId: 'pressa', sets: 4, reps: '10-12', restSec: 120 },
      { exerciseId: 'stacco-rumeno', sets: 3, reps: '8-10', restSec: 120 },
      { exerciseId: 'leg-curl', sets: 3, reps: '12-15', restSec: 60 },
      { exerciseId: 'calf-in-piedi', sets: 4, reps: '15-20', restSec: 45 },
    ],
  },
];
