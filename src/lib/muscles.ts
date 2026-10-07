/**
 * Chi lavora oltre al muscolo principale.
 *
 * Il catalogo dichiara un solo muscolo per esercizio, perché è quello che
 * serve a costruire le schede. Per la mappa anatomica invece conta anche il
 * contorno: in una panca il petto è il bersaglio, ma spalle e tricipiti
 * spingono con lui. Il contorno si ricava dallo schema di movimento, che è
 * proprio ciò che descrive quali articolazioni lavorano.
 */

import type { Exercise, MuscleGroup } from '@/types';

const BY_PATTERN: Record<string, MuscleGroup[]> = {
  'spinta-orizzontale': ['Petto', 'Spalle', 'Tricipiti'],
  'spinta-verticale': ['Spalle', 'Tricipiti', 'Petto'],
  'trazione-verticale': ['Dorso', 'Bicipiti', 'Spalle'],
  'trazione-orizzontale': ['Dorso', 'Bicipiti', 'Spalle'],
  squat: ['Gambe', 'Glutei', 'Addome'],
  cerniera: ['Glutei', 'Gambe', 'Dorso'],
  affondo: ['Gambe', 'Glutei', 'Addome'],
  core: ['Addome'],
};

export function secondaryMuscles(exercise: Exercise): MuscleGroup[] {
  const fromPattern = exercise.pattern ? (BY_PATTERN[exercise.pattern] ?? []) : [];
  return fromPattern.filter((muscle) => muscle !== exercise.muscle);
}
