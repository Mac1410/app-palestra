import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { FlatList, Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/ui/button';
import { ChipRow } from '@/components/ui/chip';
import { EmptyState } from '@/components/ui/feedback';
import { SearchBar } from '@/components/ui/input';
import { Screen } from '@/components/ui/screen';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { createId } from '@/lib/id';
import { useGym } from '@/store/gym-store';
import { MUSCLE_GROUPS, type MuscleGroup } from '@/types';

/**
 * Selezione multipla di esercizi, usata sia dall'editor delle schede
 * (parametro `routineId`) sia dall'allenamento in corso.
 */
export default function AddExercisesScreen() {
  const theme = useTheme();
  const { routineId } = useLocalSearchParams<{ routineId?: string }>();
  const { exercises, state, actions, getRoutine } = useGym();
  const [query, setQuery] = useState('');
  const [muscle, setMuscle] = useState<MuscleGroup | null>(null);
  const [selected, setSelected] = useState<string[]>([]);

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return exercises.filter((exercise) => {
      if (muscle && exercise.muscle !== muscle) return false;
      if (!normalized) return true;
      return (
        exercise.name.toLowerCase().includes(normalized) ||
        exercise.equipment.toLowerCase().includes(normalized)
      );
    });
  }, [exercises, muscle, query]);

  const toggle = (id: string) =>
    setSelected((current) =>
      current.includes(id) ? current.filter((item) => item !== id) : [...current, id],
    );

  const confirm = () => {
    if (selected.length === 0) return;

    if (routineId) {
      const routine = getRoutine(routineId);
      if (routine) {
        actions.saveRoutine({
          ...routine,
          updatedAt: Date.now(),
          exercises: [
            ...routine.exercises,
            ...selected.map((exerciseId) => ({
              id: createId('rex'),
              exerciseId,
              sets: 3,
              reps: '8-12',
              restSec: state.settings.defaultRestSec,
            })),
          ],
        });
      }
    } else {
      actions.addExercisesToSession(selected);
    }
    router.back();
  };

  return (
    <Screen scroll={false} edges={['bottom']} contentContainerStyle={styles.screen}>
      <SearchBar value={query} onChangeText={setQuery} placeholder="Cerca esercizio" />
      <ChipRow options={MUSCLE_GROUPS} value={muscle} onChange={setMuscle} />

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <EmptyState
            icon="search-outline"
            title="Nessun risultato"
            message="Nessun esercizio corrisponde alla ricerca."
          />
        }
        renderItem={({ item }) => {
          const isSelected = selected.includes(item.id);
          return (
            <Pressable
              onPress={() => toggle(item.id)}
              style={({ pressed }) => [
                styles.row,
                {
                  backgroundColor: isSelected ? theme.accentSoft : theme.backgroundElement,
                  borderColor: isSelected ? theme.accent : theme.border,
                },
                pressed && styles.pressed,
              ]}>
              <Ionicons
                name={isSelected ? 'checkmark-circle' : 'ellipse-outline'}
                size={22}
                color={isSelected ? theme.accent : theme.textMuted}
              />
              <View style={styles.rowText}>
                <ThemedText type="bodyBold" numberOfLines={1}>
                  {item.name}
                </ThemedText>
                <ThemedText type="caption" themeColor="textSecondary">
                  {item.muscle} · {item.equipment}
                </ThemedText>
              </View>
            </Pressable>
          );
        }}
      />

      <View style={[styles.footer, { borderTopColor: theme.border }]}>
        <Button
          label={
            selected.length === 0
              ? 'Seleziona esercizi'
              : `Aggiungi ${selected.length} ${selected.length === 1 ? 'esercizio' : 'esercizi'}`
          }
          full
          disabled={selected.length === 0}
          onPress={confirm}
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, paddingTop: Spacing.three, paddingBottom: 0 },
  list: { gap: Spacing.two, paddingBottom: Spacing.three },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    paddingHorizontal: Spacing.three - 2,
    paddingVertical: Spacing.three - 4,
    borderRadius: Radius.md,
    borderWidth: StyleSheet.hairlineWidth,
  },
  rowText: { flex: 1, gap: 2 },
  pressed: { opacity: 0.7 },
  footer: {
    paddingTop: Spacing.three,
    paddingBottom: Spacing.two,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
});
