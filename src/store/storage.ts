import AsyncStorage from '@react-native-async-storage/async-storage';

import { DEFAULT_SETTINGS, EMPTY_STATE, type GymState } from '@/types';

const STORAGE_KEY = 'palestra:state:v1';

/** Legge lo stato salvato. In caso di dati corrotti riparte da zero anziché crashare. */
export async function loadState(): Promise<GymState | null> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<GymState>;
    return {
      ...EMPTY_STATE,
      ...parsed,
      customExercises: parsed.customExercises ?? [],
      routines: parsed.routines ?? [],
      sessions: parsed.sessions ?? [],
      activeSession: parsed.activeSession ?? null,
      settings: { ...DEFAULT_SETTINGS, ...(parsed.settings ?? {}) },
    };
  } catch (error) {
    console.warn('[palestra] stato locale illeggibile, riparto da zero', error);
    return null;
  }
}

export async function saveState(state: GymState): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (error) {
    console.warn('[palestra] salvataggio non riuscito', error);
  }
}

export async function clearState(): Promise<void> {
  try {
    await AsyncStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.warn('[palestra] cancellazione non riuscita', error);
  }
}
