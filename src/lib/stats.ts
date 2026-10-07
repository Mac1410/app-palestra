import { addDays, startOfDay, startOfWeek } from '@/lib/format';
import type { Exercise, MuscleGroup, Session, SessionExercise, SetLog } from '@/types';

/**
 * Serie che contano per volume e record: completate, non di riscaldamento e
 * non di defaticamento — l'allungamento non è lavoro, è recupero.
 */
export function workingSets(exercise: SessionExercise): SetLog[] {
  if (exercise.phase === 'stretching') return [];
  return exercise.sets.filter((s) => s.done && !s.warmup && s.reps > 0);
}

export function exerciseVolume(exercise: SessionExercise): number {
  return workingSets(exercise).reduce((sum, s) => sum + s.weight * s.reps, 0);
}

export function sessionVolume(session: Session): number {
  return session.exercises.reduce((sum, e) => sum + exerciseVolume(e), 0);
}

export function sessionSetCount(session: Session): number {
  return session.exercises.reduce((sum, e) => sum + workingSets(e).length, 0);
}

export function sessionRepCount(session: Session): number {
  return session.exercises.reduce(
    (sum, e) => sum + workingSets(e).reduce((r, s) => r + s.reps, 0),
    0,
  );
}

export function sessionDurationSec(session: Session): number {
  const end = session.endedAt ?? Date.now();
  return Math.max(0, Math.round((end - session.startedAt) / 1000));
}

/** Massimale stimato con la formula di Epley. Sopra le 12 ripetizioni perde affidabilità. */
export function estimate1RM(weight: number, reps: number): number {
  if (weight <= 0 || reps <= 0) return 0;
  if (reps === 1) return weight;
  return weight * (1 + reps / 30);
}

export function bestSet(sets: SetLog[]): SetLog | null {
  let best: SetLog | null = null;
  let bestScore = -1;
  for (const s of sets) {
    const score = estimate1RM(s.weight, s.reps);
    if (score > bestScore) {
      bestScore = score;
      best = s;
    }
  }
  return best;
}

export type ExerciseEntry = {
  sessionId: string;
  sessionName: string;
  date: number;
  sets: SetLog[];
  volume: number;
  topWeight: number;
  best1RM: number;
  totalReps: number;
};

/** Storico di un esercizio, dalla sessione più recente alla più vecchia. */
export function exerciseHistory(sessions: Session[], exerciseId: string): ExerciseEntry[] {
  const entries: ExerciseEntry[] = [];
  for (const session of sessions) {
    if (!session.endedAt) continue;
    for (const ex of session.exercises) {
      if (ex.exerciseId !== exerciseId) continue;
      const sets = workingSets(ex);
      if (sets.length === 0) continue;
      entries.push({
        sessionId: session.id,
        sessionName: session.name,
        date: session.endedAt,
        sets,
        volume: sets.reduce((sum, s) => sum + s.weight * s.reps, 0),
        topWeight: Math.max(...sets.map((s) => s.weight)),
        best1RM: Math.max(...sets.map((s) => estimate1RM(s.weight, s.reps))),
        totalReps: sets.reduce((sum, s) => sum + s.reps, 0),
      });
    }
  }
  return entries.sort((a, b) => b.date - a.date);
}

export type PersonalRecord = {
  topWeight: number;
  best1RM: number;
  bestVolume: number;
  lastDate: number | null;
  sessions: number;
};

export function personalRecord(sessions: Session[], exerciseId: string): PersonalRecord {
  const entries = exerciseHistory(sessions, exerciseId);
  if (entries.length === 0) {
    return { topWeight: 0, best1RM: 0, bestVolume: 0, lastDate: null, sessions: 0 };
  }
  return {
    topWeight: Math.max(...entries.map((e) => e.topWeight)),
    best1RM: Math.max(...entries.map((e) => e.best1RM)),
    bestVolume: Math.max(...entries.map((e) => e.volume)),
    lastDate: entries[0].date,
    sessions: entries.length,
  };
}

/** Ultima prestazione registrata per un esercizio, usata per precompilare le serie. */
export function lastPerformance(sessions: Session[], exerciseId: string): ExerciseEntry | null {
  return exerciseHistory(sessions, exerciseId)[0] ?? null;
}

export type WeekBucket = {
  weekStart: number;
  volume: number;
  sessions: number;
  sets: number;
};

/** Volume per settimana, dalla più vecchia alla corrente (inclusa). */
export function weeklyBuckets(sessions: Session[], weeks = 8): WeekBucket[] {
  const currentWeek = startOfWeek(Date.now());
  const buckets: WeekBucket[] = [];
  for (let i = weeks - 1; i >= 0; i--) {
    buckets.push({ weekStart: addDays(currentWeek, -7 * i), volume: 0, sessions: 0, sets: 0 });
  }
  const byStart = new Map(buckets.map((b) => [b.weekStart, b]));
  for (const session of sessions) {
    if (!session.endedAt) continue;
    const bucket = byStart.get(startOfWeek(session.endedAt));
    if (!bucket) continue;
    bucket.volume += sessionVolume(session);
    bucket.sessions += 1;
    bucket.sets += sessionSetCount(session);
  }
  return buckets;
}

export type MuscleShare = {
  muscle: MuscleGroup;
  sets: number;
  volume: number;
};

/** Ripartizione del lavoro per gruppo muscolare a partire da una certa data. */
export function muscleDistribution(
  sessions: Session[],
  exercisesById: Map<string, Exercise>,
  sinceTs: number,
): MuscleShare[] {
  const totals = new Map<MuscleGroup, MuscleShare>();
  for (const session of sessions) {
    if (!session.endedAt || session.endedAt < sinceTs) continue;
    for (const ex of session.exercises) {
      const info = exercisesById.get(ex.exerciseId);
      if (!info) continue;
      const sets = workingSets(ex);
      if (sets.length === 0) continue;
      const entry = totals.get(info.muscle) ?? { muscle: info.muscle, sets: 0, volume: 0 };
      entry.sets += sets.length;
      entry.volume += sets.reduce((sum, s) => sum + s.weight * s.reps, 0);
      totals.set(info.muscle, entry);
    }
  }
  return [...totals.values()].sort((a, b) => b.sets - a.sets);
}

export function sessionsInWeek(sessions: Session[], weekStart: number): Session[] {
  const weekEnd = addDays(weekStart, 7);
  return sessions.filter((s) => s.endedAt && s.endedAt >= weekStart && s.endedAt < weekEnd);
}

/** Settimane consecutive (fino a quella scorsa) in cui l'obiettivo è stato raggiunto. */
export function weeklyStreak(sessions: Session[], goal: number): number {
  if (goal <= 0) return 0;
  let streak = 0;
  let week = startOfWeek(Date.now());
  // La settimana corrente conta solo se l'obiettivo è già stato centrato.
  if (sessionsInWeek(sessions, week).length >= goal) streak += 1;
  week = addDays(week, -7);
  while (sessionsInWeek(sessions, week).length >= goal) {
    streak += 1;
    week = addDays(week, -7);
  }
  return streak;
}

/** Giorni distinti con almeno un allenamento negli ultimi `days` giorni. */
export function activeDays(sessions: Session[], days = 30): number {
  const from = addDays(startOfDay(Date.now()), -(days - 1));
  const set = new Set<number>();
  for (const s of sessions) {
    if (s.endedAt && s.endedAt >= from) set.add(startOfDay(s.endedAt));
  }
  return set.size;
}

/**
 * Scheda suggerita: la meno recente tra quelle allenate, così da ruotare
 * naturalmente su una programmazione tipo push/pull/legs.
 */
export function suggestedRoutineId(
  sessions: Session[],
  routineIds: string[],
): string | undefined {
  if (routineIds.length === 0) return undefined;
  const lastUse = new Map<string, number>();
  for (const s of sessions) {
    if (!s.endedAt || !s.routineId) continue;
    const prev = lastUse.get(s.routineId) ?? 0;
    if (s.endedAt > prev) lastUse.set(s.routineId, s.endedAt);
  }
  return [...routineIds].sort((a, b) => (lastUse.get(a) ?? 0) - (lastUse.get(b) ?? 0))[0];
}
