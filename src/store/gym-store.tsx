import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
  type ReactNode,
} from 'react';

import { BUILTIN_EXERCISES, STARTER_ROUTINES } from '@/data/exercises';
import { type BackupData } from '@/lib/backup';
import { createId } from '@/lib/id';
import { lastPerformance } from '@/lib/stats';
import { clearState, loadState, saveState } from '@/store/storage';
import {
  EMPTY_STATE,
  type Exercise,
  type GymState,
  type Routine,
  type RoutineExercise,
  type Session,
  type SessionExercise,
  type SetLog,
  type Settings,
} from '@/types';

type Action =
  | { type: 'hydrate'; state: GymState }
  | { type: 'exercise/add'; exercise: Exercise }
  | { type: 'exercise/update'; id: string; patch: Partial<Exercise> }
  | { type: 'exercise/delete'; id: string }
  | { type: 'routine/save'; routine: Routine }
  | { type: 'routine/delete'; id: string }
  | { type: 'session/start'; session: Session }
  | { type: 'session/cancel' }
  | { type: 'session/finish' }
  | { type: 'session/patch'; patch: Partial<Pick<Session, 'name' | 'notes'>> }
  | { type: 'session/add-exercises'; exercises: SessionExercise[] }
  | { type: 'session/remove-exercise'; sessionExerciseId: string }
  | { type: 'session/patch-exercise'; sessionExerciseId: string; patch: Partial<SessionExercise> }
  | { type: 'session/add-set'; sessionExerciseId: string }
  | { type: 'session/remove-set'; sessionExerciseId: string; setId: string }
  | { type: 'session/patch-set'; sessionExerciseId: string; setId: string; patch: Partial<SetLog> }
  | { type: 'history/delete'; id: string }
  | { type: 'settings/update'; patch: Partial<Settings> }
  | { type: 'data/import'; data: BackupData }
  | { type: 'data/reset' };

function mapActiveSession(state: GymState, fn: (session: Session) => Session): GymState {
  if (!state.activeSession) return state;
  return { ...state, activeSession: fn(state.activeSession) };
}

function mapSessionExercise(
  session: Session,
  sessionExerciseId: string,
  fn: (exercise: SessionExercise) => SessionExercise,
): Session {
  return {
    ...session,
    exercises: session.exercises.map((e) => (e.id === sessionExerciseId ? fn(e) : e)),
  };
}

function reducer(state: GymState, action: Action): GymState {
  switch (action.type) {
    case 'hydrate':
      return action.state;

    case 'exercise/add':
      return { ...state, customExercises: [...state.customExercises, action.exercise] };

    case 'exercise/update':
      return {
        ...state,
        customExercises: state.customExercises.map((e) =>
          e.id === action.id ? { ...e, ...action.patch } : e,
        ),
      };

    case 'exercise/delete':
      return {
        ...state,
        customExercises: state.customExercises.filter((e) => e.id !== action.id),
      };

    case 'routine/save': {
      const exists = state.routines.some((r) => r.id === action.routine.id);
      return {
        ...state,
        routines: exists
          ? state.routines.map((r) => (r.id === action.routine.id ? action.routine : r))
          : [...state.routines, action.routine],
      };
    }

    case 'routine/delete':
      return { ...state, routines: state.routines.filter((r) => r.id !== action.id) };

    case 'session/start':
      return { ...state, activeSession: action.session };

    case 'session/cancel':
      return { ...state, activeSession: null };

    case 'session/finish': {
      if (!state.activeSession) return state;
      const finished: Session = {
        ...state.activeSession,
        endedAt: Date.now(),
        // Le serie non completate non finiscono nello storico.
        exercises: state.activeSession.exercises
          .map((e) => ({ ...e, sets: e.sets.filter((s) => s.done) }))
          .filter((e) => e.sets.length > 0),
      };
      if (finished.exercises.length === 0) {
        return { ...state, activeSession: null };
      }
      return { ...state, activeSession: null, sessions: [finished, ...state.sessions] };
    }

    case 'session/patch':
      return mapActiveSession(state, (s) => ({ ...s, ...action.patch }));

    case 'session/add-exercises':
      return mapActiveSession(state, (s) => ({
        ...s,
        exercises: [...s.exercises, ...action.exercises],
      }));

    case 'session/remove-exercise':
      return mapActiveSession(state, (s) => ({
        ...s,
        exercises: s.exercises.filter((e) => e.id !== action.sessionExerciseId),
      }));

    case 'session/patch-exercise':
      return mapActiveSession(state, (s) =>
        mapSessionExercise(s, action.sessionExerciseId, (e) => ({ ...e, ...action.patch })),
      );

    case 'session/add-set':
      return mapActiveSession(state, (s) =>
        mapSessionExercise(s, action.sessionExerciseId, (e) => {
          const previous = e.sets[e.sets.length - 1];
          return {
            ...e,
            sets: [
              ...e.sets,
              {
                id: createId('set'),
                weight: previous?.weight ?? 0,
                reps: previous?.reps ?? 0,
                done: false,
              },
            ],
          };
        }),
      );

    case 'session/remove-set':
      return mapActiveSession(state, (s) =>
        mapSessionExercise(s, action.sessionExerciseId, (e) => ({
          ...e,
          sets: e.sets.filter((set) => set.id !== action.setId),
        })),
      );

    case 'session/patch-set':
      return mapActiveSession(state, (s) =>
        mapSessionExercise(s, action.sessionExerciseId, (e) => ({
          ...e,
          sets: e.sets.map((set) => (set.id === action.setId ? { ...set, ...action.patch } : set)),
        })),
      );

    case 'history/delete':
      return { ...state, sessions: state.sessions.filter((s) => s.id !== action.id) };

    case 'settings/update':
      return { ...state, settings: { ...state.settings, ...action.patch } };

    case 'data/import':
      // Il backup sostituisce i dati: un'eventuale sessione in corso viene chiusa.
      return { ...EMPTY_STATE, ...action.data, activeSession: null };

    case 'data/reset':
      return EMPTY_STATE;

    default:
      return state;
  }
}

/** Schede di esempio, create solo al primissimo avvio. */
function seedRoutines(): Routine[] {
  const now = Date.now();
  return STARTER_ROUTINES.map((template, index) => ({
    id: createId('routine'),
    name: template.name,
    description: template.description,
    createdAt: now + index,
    updatedAt: now + index,
    exercises: template.exercises.map((e) => ({
      id: createId('rex'),
      exerciseId: e.exerciseId,
      sets: e.sets,
      reps: e.reps,
      restSec: e.restSec,
    })),
  }));
}

type GymContextValue = {
  state: GymState;
  ready: boolean;
  /** Catalogo di base + esercizi personalizzati. */
  exercises: Exercise[];
  exercisesById: Map<string, Exercise>;
  getExercise: (id: string) => Exercise | undefined;
  getExerciseName: (id: string) => string;
  getRoutine: (id: string) => Routine | undefined;
  getSession: (id: string) => Session | undefined;
  dispatch: React.Dispatch<Action>;
  actions: {
    addExercise: (data: Omit<Exercise, 'id' | 'custom'>) => Exercise;
    updateExercise: (id: string, patch: Partial<Exercise>) => void;
    deleteExercise: (id: string) => void;
    saveRoutine: (routine: Routine) => void;
    deleteRoutine: (id: string) => void;
    duplicateRoutine: (id: string) => void;
    startSession: (routineId?: string) => Session | null;
    addExercisesToSession: (exerciseIds: string[]) => void;
    removeSessionExercise: (sessionExerciseId: string) => void;
    patchSessionExercise: (sessionExerciseId: string, patch: Partial<SessionExercise>) => void;
    addSet: (sessionExerciseId: string) => void;
    removeSet: (sessionExerciseId: string, setId: string) => void;
    patchSet: (sessionExerciseId: string, setId: string, patch: Partial<SetLog>) => void;
    patchSession: (patch: Partial<Pick<Session, 'name' | 'notes'>>) => void;
    finishSession: () => void;
    cancelSession: () => void;
    deleteSessionFromHistory: (id: string) => void;
    updateSettings: (patch: Partial<Settings>) => void;
    importData: (data: BackupData) => void;
    resetAllData: () => Promise<void>;
  };
};

const GymContext = createContext<GymContextValue | null>(null);

export function GymProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, EMPTY_STATE);
  const [ready, setReady] = useState(false);
  const stateRef = useRef(state);
  stateRef.current = state;

  // Idratazione iniziale dallo storage locale.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const stored = await loadState();
      if (cancelled) return;
      dispatch({
        type: 'hydrate',
        state: stored ?? { ...EMPTY_STATE, routines: seedRoutines() },
      });
      setReady(true);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // Persistenza con debounce: l'editor di sessione aggiorna lo stato a ogni tasto.
  useEffect(() => {
    if (!ready) return;
    const timeout = setTimeout(() => {
      void saveState(state);
    }, 400);
    return () => clearTimeout(timeout);
  }, [state, ready]);

  const exercises = useMemo(
    () =>
      [...BUILTIN_EXERCISES, ...state.customExercises].sort((a, b) =>
        a.name.localeCompare(b.name, 'it'),
      ),
    [state.customExercises],
  );

  const exercisesById = useMemo(
    () => new Map(exercises.map((e) => [e.id, e])),
    [exercises],
  );

  const value = useMemo<GymContextValue>(() => {
    const getExercise = (id: string) => exercisesById.get(id);

    const buildSessionExercise = (
      exerciseId: string,
      options: { sets?: number; reps?: string; restSec?: number; weight?: number } = {},
    ): SessionExercise => {
      const previous = lastPerformance(stateRef.current.sessions, exerciseId);
      const setCount = options.sets ?? previous?.sets.length ?? 3;
      const defaultRest = stateRef.current.settings.defaultRestSec;
      return {
        id: createId('sex'),
        exerciseId,
        restSec: options.restSec ?? defaultRest,
        targetReps: options.reps,
        sets: Array.from({ length: setCount }, (_, i) => {
          const reference = previous?.sets[i] ?? previous?.sets[previous.sets.length - 1];
          return {
            id: createId('set'),
            weight: reference?.weight ?? options.weight ?? 0,
            reps: reference?.reps ?? 0,
            done: false,
          };
        }),
      };
    };

    const actions: GymContextValue['actions'] = {
      addExercise: (data) => {
        const exercise: Exercise = { ...data, id: createId('ex'), custom: true };
        dispatch({ type: 'exercise/add', exercise });
        return exercise;
      },
      updateExercise: (id, patch) => dispatch({ type: 'exercise/update', id, patch }),
      deleteExercise: (id) => dispatch({ type: 'exercise/delete', id }),
      saveRoutine: (routine) => dispatch({ type: 'routine/save', routine }),
      deleteRoutine: (id) => dispatch({ type: 'routine/delete', id }),
      duplicateRoutine: (id) => {
        const source = stateRef.current.routines.find((r) => r.id === id);
        if (!source) return;
        const now = Date.now();
        dispatch({
          type: 'routine/save',
          routine: {
            ...source,
            id: createId('routine'),
            name: `${source.name} (copia)`,
            createdAt: now,
            updatedAt: now,
            exercises: source.exercises.map((e) => ({ ...e, id: createId('rex') })),
          },
        });
      },
      startSession: (routineId) => {
        const routine = routineId
          ? stateRef.current.routines.find((r) => r.id === routineId)
          : undefined;
        const session: Session = {
          id: createId('session'),
          routineId: routine?.id,
          name: routine?.name ?? 'Allenamento libero',
          startedAt: Date.now(),
          exercises: (routine?.exercises ?? []).map((e: RoutineExercise) =>
            buildSessionExercise(e.exerciseId, {
              sets: e.sets,
              reps: e.reps,
              restSec: e.restSec,
              weight: e.weight,
            }),
          ),
        };
        dispatch({ type: 'session/start', session });
        return session;
      },
      addExercisesToSession: (exerciseIds) =>
        dispatch({
          type: 'session/add-exercises',
          exercises: exerciseIds.map((id) => buildSessionExercise(id)),
        }),
      removeSessionExercise: (sessionExerciseId) =>
        dispatch({ type: 'session/remove-exercise', sessionExerciseId }),
      patchSessionExercise: (sessionExerciseId, patch) =>
        dispatch({ type: 'session/patch-exercise', sessionExerciseId, patch }),
      addSet: (sessionExerciseId) => dispatch({ type: 'session/add-set', sessionExerciseId }),
      removeSet: (sessionExerciseId, setId) =>
        dispatch({ type: 'session/remove-set', sessionExerciseId, setId }),
      patchSet: (sessionExerciseId, setId, patch) =>
        dispatch({ type: 'session/patch-set', sessionExerciseId, setId, patch }),
      patchSession: (patch) => dispatch({ type: 'session/patch', patch }),
      finishSession: () => dispatch({ type: 'session/finish' }),
      cancelSession: () => dispatch({ type: 'session/cancel' }),
      deleteSessionFromHistory: (id) => dispatch({ type: 'history/delete', id }),
      updateSettings: (patch) => dispatch({ type: 'settings/update', patch }),
      importData: (data) => dispatch({ type: 'data/import', data }),
      resetAllData: async () => {
        dispatch({ type: 'data/reset' });
        await clearState();
      },
    };

    return {
      state,
      ready,
      exercises,
      exercisesById,
      getExercise,
      getExerciseName: (id) => getExercise(id)?.name ?? 'Esercizio rimosso',
      getRoutine: (id) => state.routines.find((r) => r.id === id),
      getSession: (id) => state.sessions.find((s) => s.id === id),
      dispatch,
      actions,
    };
  }, [state, ready, exercises, exercisesById]);

  return <GymContext.Provider value={value}>{children}</GymContext.Provider>;
}

export function useGym(): GymContextValue {
  const context = useContext(GymContext);
  if (!context) throw new Error('useGym deve essere usato dentro <GymProvider>');
  return context;
}
