import { Ionicons } from '@expo/vector-icons';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Button, IconButton } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useDialog } from '@/components/ui/dialog';
import { EmptyState } from '@/components/ui/feedback';
import { Field, Stepper } from '@/components/ui/input';
import { Screen } from '@/components/ui/screen';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { createId } from '@/lib/id';
import { useGym } from '@/store/gym-store';
import type { Routine, RoutineExercise } from '@/types';

export default function RoutineEditorScreen() {
  const theme = useTheme();
  const dialog = useDialog();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { state, ready, actions, getRoutine, getExercise } = useGym();
  const creating = useRef(false);

  // "nuova" è una rotta sentinella: crea la scheda e passa al suo id reale.
  // Si aspetta l'idratazione, altrimenti lo stato caricato sovrascriverebbe la nuova scheda.
  useEffect(() => {
    if (!ready || id !== 'nuova' || creating.current) return;
    creating.current = true;
    const now = Date.now();
    const routine: Routine = {
      id: createId('routine'),
      name: 'Nuova scheda',
      description: '',
      exercises: [],
      createdAt: now,
      updatedAt: now,
    };
    actions.saveRoutine(routine);
    router.replace({ pathname: '/scheda/[id]', params: { id: routine.id } });
  }, [id, ready, actions]);

  const routine = getRoutine(id);

  if (!routine) {
    return (
      <Screen>
        <ThemedText type="small" themeColor="textMuted">
          {!ready || id === 'nuova' ? 'Creazione in corso…' : 'Scheda non trovata.'}
        </ThemedText>
      </Screen>
    );
  }

  const patch = (changes: Partial<Routine>) =>
    actions.saveRoutine({ ...routine, ...changes, updatedAt: Date.now() });

  const patchExercise = (exerciseRowId: string, changes: Partial<RoutineExercise>) =>
    patch({
      exercises: routine.exercises.map((e) =>
        e.id === exerciseRowId ? { ...e, ...changes } : e,
      ),
    });

  const move = (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= routine.exercises.length) return;
    const next = [...routine.exercises];
    [next[index], next[target]] = [next[target], next[index]];
    patch({ exercises: next });
  };

  const removeExercise = (exerciseRowId: string) =>
    patch({ exercises: routine.exercises.filter((e) => e.id !== exerciseRowId) });

  const confirmDelete = async () => {
    const ok = await dialog.confirm({
      title: 'Eliminare la scheda?',
      message: `"${routine.name}" verrà rimossa definitivamente.`,
      confirmLabel: 'Elimina',
      destructive: true,
    });
    if (!ok) return;
    actions.deleteRoutine(routine.id);
    router.back();
  };

  const totalSets = routine.exercises.reduce((sum, e) => sum + e.sets, 0);

  return (
    <Screen>
      <Stack.Screen options={{ title: routine.name || 'Scheda' }} />

      <Field
        label="Nome"
        value={routine.name}
        onChangeText={(text) => patch({ name: text })}
        placeholder="Es. Push, Gambe, Full body"
      />
      <Field
        label="Note"
        value={routine.description ?? ''}
        onChangeText={(text) => patch({ description: text })}
        placeholder="A cosa serve questa scheda"
      />

      <View style={styles.summary}>
        <ThemedText type="captionBold" themeColor="textMuted">
          {routine.exercises.length} ESERCIZI · {totalSets} SERIE
        </ThemedText>
      </View>

      {routine.exercises.length === 0 ? (
        <EmptyState
          icon="barbell-outline"
          title="Scheda vuota"
          message="Aggiungi gli esercizi che vuoi eseguire, con serie, ripetizioni e recupero."
        />
      ) : (
        routine.exercises.map((item, index) => {
          const exercise = getExercise(item.exerciseId);
          return (
            <Card key={item.id} compact>
              <View style={styles.rowBetween}>
                <View style={styles.flexShrink}>
                  <ThemedText type="bodyBold" numberOfLines={1}>
                    {index + 1}. {exercise?.name ?? 'Esercizio rimosso'}
                  </ThemedText>
                  <ThemedText type="caption" themeColor="textSecondary">
                    {exercise ? `${exercise.muscle} · ${exercise.equipment}` : '—'}
                  </ThemedText>
                </View>
                <View style={styles.rowActions}>
                  <IconButton
                    icon="chevron-up"
                    size={18}
                    accessibilityLabel="Sposta su"
                    onPress={() => move(index, -1)}
                  />
                  <IconButton
                    icon="chevron-down"
                    size={18}
                    accessibilityLabel="Sposta giù"
                    onPress={() => move(index, 1)}
                  />
                  <IconButton
                    icon="trash-outline"
                    size={18}
                    color={theme.danger}
                    accessibilityLabel="Rimuovi esercizio"
                    onPress={() => removeExercise(item.id)}
                  />
                </View>
              </View>

              <View style={styles.paramRow}>
                <View style={styles.param}>
                  <ThemedText type="caption" themeColor="textMuted">
                    Serie
                  </ThemedText>
                  <Stepper
                    value={item.sets}
                    min={1}
                    max={12}
                    onChange={(value) => patchExercise(item.id, { sets: value })}
                  />
                </View>
                <View style={styles.param}>
                  <ThemedText type="caption" themeColor="textMuted">
                    Ripetizioni
                  </ThemedText>
                  <TextInput
                    value={item.reps}
                    onChangeText={(text) => patchExercise(item.id, { reps: text })}
                    placeholder="8-12"
                    placeholderTextColor={theme.textMuted}
                    style={[
                      styles.repsInput,
                      { backgroundColor: theme.backgroundSelected, color: theme.text },
                    ]}
                  />
                </View>
              </View>

              <View style={styles.param}>
                <ThemedText type="caption" themeColor="textMuted">
                  Recupero
                </ThemedText>
                <Stepper
                  value={item.restSec}
                  step={15}
                  min={0}
                  max={600}
                  format={(value) => `${value}s`}
                  onChange={(value) => patchExercise(item.id, { restSec: value })}
                />
              </View>
            </Card>
          );
        })
      )}

      <Button
        label="Aggiungi esercizi"
        icon="add"
        variant="secondary"
        full
        onPress={() =>
          router.push({ pathname: '/aggiungi-esercizi', params: { routineId: routine.id } })
        }
      />

      <Button
        label="Inizia questo allenamento"
        icon="play"
        full
        disabled={routine.exercises.length === 0}
        onPress={() => {
          actions.startSession(routine.id);
          router.push('/sessione');
        }}
      />

      <Button label="Elimina scheda" variant="danger" full onPress={confirmDelete} />

      {state.activeSession ? (
        <View style={styles.hint}>
          <Ionicons name="information-circle-outline" size={16} color={theme.textMuted} />
          <ThemedText type="caption" themeColor="textMuted">
            Hai già un allenamento in corso: avviandone uno nuovo quello attuale viene sostituito.
          </ThemedText>
        </View>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  summary: { marginTop: Spacing.one },
  rowBetween: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.two,
  },
  flexShrink: { flexShrink: 1, gap: 2 },
  rowActions: { flexDirection: 'row', alignItems: 'center' },
  paramRow: { flexDirection: 'row', gap: Spacing.three, flexWrap: 'wrap' },
  param: { gap: Spacing.one },
  repsInput: {
    borderRadius: Radius.pill,
    paddingHorizontal: Spacing.three - 4,
    paddingVertical: Spacing.two - 1,
    fontSize: 16,
    fontWeight: '600',
    minWidth: 96,
    textAlign: 'center',
  },
  hint: { flexDirection: 'row', gap: Spacing.one, alignItems: 'flex-start' },
});
