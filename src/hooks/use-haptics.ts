import * as Haptics from 'expo-haptics';
import { useMemo } from 'react';
import { Platform } from 'react-native';

import { useGym } from '@/store/gym-store';

/**
 * Feedback aptico rispettoso dell'impostazione utente.
 * Su web le API non esistono: le chiamate diventano no-op.
 */
export function useHaptics() {
  const { state } = useGym();
  const enabled = state.settings.haptics && Platform.OS !== 'web';

  return useMemo(
    () => ({
      tap: () => {
        if (enabled) void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      },
      success: () => {
        if (enabled) void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      },
      warning: () => {
        if (enabled) void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      },
      heavy: () => {
        if (enabled) void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      },
    }),
    [enabled],
  );
}
