import { router, Stack, useLocalSearchParams } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { MuscleMap } from '@/components/body/muscle-map';
import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Chip } from '@/components/ui/chip';
import { useDialog } from '@/components/ui/dialog';
import { EmptyState, SectionHeader } from '@/components/ui/feedback';
import { Screen } from '@/components/ui/screen';
import { BarChart, StatTile } from '@/components/ui/stats';
import { Colors, Spacing } from '@/constants/theme';
import { formatRelativeDay, formatShortDate, formatVolume } from '@/lib/format';
import { secondaryMuscles } from '@/lib/muscles';
import { exerciseHistory, personalRecord } from '@/lib/stats';
import { useGym } from '@/store/gym-store';

export default function ExerciseDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const dialog = useDialog();
  const { getExercise, state, actions } = useGym();
  const exercise = getExercise(id);

  if (!exercise) {
    return (
      <Screen>
        <ThemedText type="small" themeColor="textMuted">
          Esercizio non trovato.
        </ThemedText>
      </Screen>
    );
  }

  const secondary = secondaryMuscles(exercise);
  const history = exerciseHistory(state.sessions, exercise.id);
  const record = personalRecord(state.sessions, exercise.id);
  const chartData = history
    .slice(0, 8)
    .reverse()
    .map((entry) => ({
      label: formatShortDate(entry.date),
      value: Math.round(entry.best1RM),
      highlight: entry.best1RM >= record.best1RM,
    }));

  const confirmDelete = async () => {
    const ok = await dialog.confirm({
      title: 'Eliminare l’esercizio?',
      message: `"${exercise.name}" verrà rimosso dal catalogo.`,
      confirmLabel: 'Elimina',
      destructive: true,
    });
    if (!ok) return;
    actions.deleteExercise(exercise.id);
    router.back();
  };

  return (
    <Screen>
      <Stack.Screen options={{ title: exercise.name }} />

      <View style={styles.header}>
        <ThemedText type="title">{exercise.name}</ThemedText>
        <View style={styles.chips}>
          <Chip label={exercise.muscle} tone="accent" />
          <Chip label={exercise.equipment} />
          {exercise.custom ? <Chip label="Personale" tone="success" /> : null}
        </View>
      </View>

      {exercise.notes ? (
        <Card>
          <ThemedText type="small" themeColor="textSecondary">
            {exercise.notes}
          </ThemedText>
        </Card>
      ) : null}

      <SectionHeader title="Muscoli coinvolti" />
      <Card>
        <MuscleMap primary={exercise.muscle} secondary={secondary} />
        <View style={styles.legend}>
          <View style={styles.legendItem}>
            <View style={[styles.dot, { backgroundColor: Colors.accent }]} />
            <ThemedText type="caption" themeColor="textSecondary">
              {exercise.muscle}
            </ThemedText>
          </View>
          {secondary.length > 0 ? (
            <View style={styles.legendItem}>
              <View style={[styles.dot, { backgroundColor: '#4E8F6B' }]} />
              <ThemedText type="caption" themeColor="textSecondary">
                {secondary.join(', ')}
              </ThemedText>
            </View>
          ) : null}
        </View>
      </Card>

      <View style={styles.tiles}>
        <StatTile
          label="Record"
          value={record.topWeight > 0 ? `${record.topWeight} kg` : '—'}
          icon="trophy"
          tone="accent"
        />
        <StatTile
          label="1RM stimato"
          value={record.best1RM > 0 ? `${Math.round(record.best1RM)} kg` : '—'}
          icon="trending-up"
        />
        <StatTile
          label="Sessioni"
          value={String(record.sessions)}
          icon="calendar"
          hint={record.lastDate ? formatRelativeDay(record.lastDate) : 'Mai eseguito'}
        />
      </View>

      {chartData.length > 0 ? (
        <>
          <SectionHeader title="Andamento" subtitle="1RM stimato per sessione" />
          <Card>
            <BarChart data={chartData} formatValue={(value) => `${value}`} />
          </Card>
        </>
      ) : null}

      <SectionHeader title="Storico" />
      {history.length === 0 ? (
        <EmptyState
          icon="stats-chart-outline"
          title="Nessun dato"
          message="Inserisci questo esercizio in un allenamento per iniziare a tracciarlo."
        />
      ) : (
        history.map((entry) => (
          <Card
            key={`${entry.sessionId}-${entry.date}`}
            compact
            onPress={() =>
              router.push({ pathname: '/storico/[id]', params: { id: entry.sessionId } })
            }>
            <View style={styles.rowBetween}>
              <ThemedText type="bodyBold">{formatRelativeDay(entry.date)}</ThemedText>
              <ThemedText type="caption" themeColor="textSecondary">
                {formatVolume(entry.volume)}
              </ThemedText>
            </View>
            <ThemedText type="caption" themeColor="textSecondary">
              {entry.sets.map((set) => `${set.weight}×${set.reps}`).join('  ·  ')}
            </ThemedText>
            <ThemedText type="caption" themeColor="textMuted">
              Migliore: {entry.topWeight} kg · 1RM ~{Math.round(entry.best1RM)} kg
            </ThemedText>
          </Card>
        ))
      )}

      {exercise.custom ? (
        <Button label="Elimina esercizio" variant="danger" full onPress={confirmDelete} />
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  legend: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.three, marginTop: Spacing.two },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  dot: { width: 10, height: 10, borderRadius: 5 },
  header: { gap: Spacing.two, marginTop: Spacing.two },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.one + 2 },
  tiles: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two },
  rowBetween: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.two,
  },
});
