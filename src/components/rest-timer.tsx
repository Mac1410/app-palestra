import { Ionicons } from '@expo/vector-icons';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Radius, Spacing } from '@/constants/theme';
import { useHaptics } from '@/hooks/use-haptics';
import { useTheme } from '@/hooks/use-theme';
import { formatDuration } from '@/lib/format';

export type RestTimer = ReturnType<typeof useRestTimer>;

/**
 * Timer di recupero basato sull'orario di fine, così resta preciso anche se
 * l'intervallo viene rallentato dal sistema.
 */
export function useRestTimer(onComplete?: () => void) {
  const [endAt, setEndAt] = useState<number | null>(null);
  const [total, setTotal] = useState(0);
  const [remaining, setRemaining] = useState(0);
  const completeRef = useRef(onComplete);
  completeRef.current = onComplete;

  useEffect(() => {
    if (endAt === null) return;
    const tick = () => {
      const left = Math.max(0, Math.round((endAt - Date.now()) / 1000));
      setRemaining(left);
      if (left === 0) {
        setEndAt(null);
        completeRef.current?.();
      }
    };
    tick();
    const interval = setInterval(tick, 250);
    return () => clearInterval(interval);
  }, [endAt]);

  const start = useCallback((seconds: number) => {
    if (seconds <= 0) return;
    setTotal(seconds);
    setRemaining(seconds);
    setEndAt(Date.now() + seconds * 1000);
  }, []);

  const stop = useCallback(() => {
    setEndAt(null);
    setRemaining(0);
    setTotal(0);
  }, []);

  const extend = useCallback(
    (seconds: number) => {
      setTotal((current) => Math.max(0, current + seconds));
      setEndAt((current) => {
        if (current === null) return current;
        const next = current + seconds * 1000;
        return next <= Date.now() ? Date.now() : next;
      });
    },
    [],
  );

  return { running: endAt !== null, remaining, total, start, stop, extend };
}

export function RestTimerBar({ timer }: { timer: RestTimer }) {
  const theme = useTheme();
  const haptics = useHaptics();
  const progress = timer.total > 0 ? 1 - timer.remaining / timer.total : 0;

  return (
    <View style={[styles.bar, { backgroundColor: theme.accent }]}>
      <View style={[styles.progress, { width: `${Math.min(100, progress * 100)}%` }]} />
      <View style={styles.barContent}>
        <View style={styles.label}>
          <Ionicons name="time-outline" size={18} color={theme.onAccent} />
          <ThemedText type="caption" style={{ color: theme.onAccent }}>
            Recupero
          </ThemedText>
        </View>
        <ThemedText type="heading" style={{ color: theme.onAccent }}>
          {formatDuration(timer.remaining)}
        </ThemedText>
        <View style={styles.actions}>
          <Pressable
            accessibilityLabel="Aggiungi 30 secondi"
            hitSlop={8}
            onPress={() => {
              haptics.tap();
              timer.extend(30);
            }}
            style={styles.action}>
            <ThemedText type="smallBold" style={{ color: theme.onAccent }}>
              +30s
            </ThemedText>
          </Pressable>
          <Pressable
            accessibilityLabel="Salta il recupero"
            hitSlop={8}
            onPress={() => {
              haptics.tap();
              timer.stop();
            }}
            style={styles.action}>
            <Ionicons name="play-skip-forward" size={18} color={theme.onAccent} />
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    borderRadius: Radius.lg,
    overflow: 'hidden',
  },
  progress: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.18)',
  },
  barContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two + 2,
    gap: Spacing.two,
  },
  label: { flexDirection: 'row', alignItems: 'center', gap: Spacing.one },
  actions: { flexDirection: 'row', alignItems: 'center', gap: Spacing.three },
  action: { paddingHorizontal: Spacing.one, paddingVertical: Spacing.half },
});
