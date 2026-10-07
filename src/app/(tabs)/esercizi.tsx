import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { FlatList, Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { IconButton } from '@/components/ui/button';
import { Chip, ChipRow } from '@/components/ui/chip';
import { EmptyState } from '@/components/ui/feedback';
import { SearchBar } from '@/components/ui/input';
import { Screen } from '@/components/ui/screen';
import { BottomTabInset, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { personalRecord } from '@/lib/stats';
import { useGym } from '@/store/gym-store';
import { MUSCLE_GROUPS, type MuscleGroup } from '@/types';

export default function ExercisesScreen() {
  const theme = useTheme();
  const { exercises, state } = useGym();
  const [query, setQuery] = useState('');
  const [muscle, setMuscle] = useState<MuscleGroup | null>(null);

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return exercises.filter((exercise) => {
      if (muscle && exercise.muscle !== muscle) return false;
      if (!normalized) return true;
      return (
        exercise.name.toLowerCase().includes(normalized) ||
        exercise.muscle.toLowerCase().includes(normalized) ||
        exercise.equipment.toLowerCase().includes(normalized)
      );
    });
  }, [exercises, muscle, query]);

  return (
    <Screen scroll={false} contentContainerStyle={styles.screen}>
      <View style={styles.header}>
        <View style={styles.headerText}>
          <ThemedText type="title">Esercizi</ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            {filtered.length} disponibili
          </ThemedText>
        </View>
        <IconButton
          icon="add-circle"
          size={30}
          color={theme.accent}
          accessibilityLabel="Nuovo esercizio"
          onPress={() => router.push('/nuovo-esercizio')}
        />
      </View>

      <SearchBar value={query} onChangeText={setQuery} placeholder="Cerca esercizio o attrezzo" />
      <ChipRow options={MUSCLE_GROUPS} value={muscle} onChange={setMuscle} />

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        ListEmptyComponent={
          <EmptyState
            icon="search-outline"
            title="Nessun risultato"
            message="Prova a cambiare filtro oppure crea un esercizio personalizzato."
          />
        }
        renderItem={({ item }) => {
          const record = personalRecord(state.sessions, item.id);
          return (
            <Pressable
              onPress={() => router.push({ pathname: '/esercizio/[id]', params: { id: item.id } })}
              style={({ pressed }) => [
                styles.row,
                { backgroundColor: theme.backgroundElement, borderColor: theme.border },
                pressed && styles.pressed,
              ]}>
              <View style={styles.rowText}>
                <ThemedText type="bodyBold" numberOfLines={1}>
                  {item.name}
                </ThemedText>
                <ThemedText type="caption" themeColor="textSecondary">
                  {item.muscle} · {item.equipment}
                  {record.topWeight > 0 ? ` · max ${record.topWeight} kg` : ''}
                </ThemedText>
              </View>
              {item.custom ? <Chip label="Personale" tone="accent" /> : null}
              <Ionicons name="chevron-forward" size={16} color={theme.textMuted} />
            </Pressable>
          );
        }}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, paddingBottom: 0 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: Spacing.two,
  },
  headerText: { gap: 2 },
  list: { gap: Spacing.two, paddingBottom: BottomTabInset + Spacing.five },
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
});
