import { router, Stack, useLocalSearchParams } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useDialog } from '@/components/ui/dialog';
import { Divider } from '@/components/ui/feedback';
import { Screen } from '@/components/ui/screen';
import { StatTile } from '@/components/ui/stats';
import { Spacing } from '@/constants/theme';
import { formatDate, formatDurationShort, formatTime, formatVolume } from '@/lib/format';
import {
  estimate1RM,
  exerciseVolume,
  sessionDurationSec,
  sessionRepCount,
  sessionSetCount,
  sessionVolume,
  workingSets,
} from '@/lib/stats';
import { useGym } from '@/store/gym-store';

export default function SessionDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const dialog = useDialog();
  const { getSession, getExercise, actions } = useGym();
  const session = getSession(id);

  if (!session) {
    return (
      <Screen>
        <ThemedText type="small" themeColor="textMuted">
          Allenamento non trovato.
        </ThemedText>
      </Screen>
    );
  }

  const endedAt = session.endedAt ?? session.startedAt;

  const confirmDelete = async () => {
    const ok = await dialog.confirm({
      title: 'Eliminare l’allenamento?',
      message: 'L’operazione non può essere annullata.',
      confirmLabel: 'Elimina',
      destructive: true,
    });
    if (!ok) return;
    actions.deleteSessionFromHistory(session.id);
    router.back();
  };

  return (
    <Screen>
      <Stack.Screen options={{ title: session.name }} />

      <View style={styles.header}>
        <ThemedText type="title">{session.name}</ThemedText>
        <ThemedText type="small" themeColor="textSecondary">
          {formatDate(endedAt)} · {formatTime(session.startedAt)}–{formatTime(endedAt)}
        </ThemedText>
      </View>

      <View style={styles.tiles}>
        <StatTile
          label="Volume"
          value={formatVolume(sessionVolume(session))}
          icon="barbell"
          tone="accent"
        />
        <StatTile label="Serie" value={String(sessionSetCount(session))} icon="repeat" />
        <StatTile
          label="Durata"
          value={formatDurationShort(sessionDurationSec(session))}
          icon="time"
        />
        <StatTile label="Ripetizioni" value={String(sessionRepCount(session))} icon="fitness" />
      </View>

      {session.notes ? (
        <Card>
          <ThemedText type="captionBold" themeColor="textMuted">
            NOTE
          </ThemedText>
          <ThemedText type="small">{session.notes}</ThemedText>
        </Card>
      ) : null}

      {session.exercises.map((item) => {
        const exercise = getExercise(item.exerciseId);
        const sets = workingSets(item);
        return (
          <Card key={item.id}>
            <View style={styles.rowBetween}>
              <ThemedText type="subtitle" numberOfLines={2} style={styles.flexShrink}>
                {exercise?.name ?? 'Esercizio rimosso'}
              </ThemedText>
              <ThemedText type="caption" themeColor="textSecondary">
                {formatVolume(exerciseVolume(item))}
              </ThemedText>
            </View>
            <Divider />
            {sets.map((set, index) => (
              <View key={set.id} style={styles.setRow}>
                <ThemedText type="caption" themeColor="textMuted" style={styles.setIndex}>
                  {index + 1}
                </ThemedText>
                <ThemedText type="small" style={styles.setValue}>
                  {set.weight} kg × {set.reps}
                </ThemedText>
                <ThemedText type="caption" themeColor="textMuted">
                  1RM ~{Math.round(estimate1RM(set.weight, set.reps))} kg
                </ThemedText>
              </View>
            ))}
            {item.note ? (
              <ThemedText type="caption" themeColor="textSecondary">
                {item.note}
              </ThemedText>
            ) : null}
          </Card>
        );
      })}

      <Button label="Elimina allenamento" variant="danger" full onPress={confirmDelete} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { gap: 2, marginTop: Spacing.two },
  tiles: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two },
  rowBetween: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.two,
  },
  flexShrink: { flexShrink: 1 },
  setRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.two,
    paddingVertical: 2,
  },
  setIndex: { width: 18 },
  setValue: { flex: 1 },
});
