import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Button, IconButton } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Chip } from '@/components/ui/chip';
import { useDialog } from '@/components/ui/dialog';
import { EmptyState } from '@/components/ui/feedback';
import { Screen } from '@/components/ui/screen';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { formatRelativeDay } from '@/lib/format';
import { useGym } from '@/store/gym-store';
import type { MuscleGroup } from '@/types';

export default function RoutinesScreen() {
  const theme = useTheme();
  const dialog = useDialog();
  const { state, actions, exercisesById } = useGym();
  const { routines, sessions } = state;

  const lastUse = (routineId: string) => {
    const session = sessions.find((s) => s.routineId === routineId && s.endedAt);
    return session?.endedAt ? formatRelativeDay(session.endedAt) : 'Mai usata';
  };

  const muscles = (routineId: string): MuscleGroup[] => {
    const routine = routines.find((r) => r.id === routineId);
    if (!routine) return [];
    const found: MuscleGroup[] = [];
    for (const item of routine.exercises) {
      const muscle = exercisesById.get(item.exerciseId)?.muscle;
      if (muscle && !found.includes(muscle)) found.push(muscle);
    }
    return found.slice(0, 4);
  };

  const confirmDelete = async (id: string, name: string) => {
    const ok = await dialog.confirm({
      title: 'Eliminare la scheda?',
      message: `"${name}" verrà rimossa definitivamente.`,
      confirmLabel: 'Elimina',
      destructive: true,
    });
    if (ok) actions.deleteRoutine(id);
  };

  const openActions = async (id: string, name: string) => {
    const choice = await dialog.choose({
      title: name,
      options: [
        { label: 'Duplica', value: 'duplica' },
        { label: 'Elimina', value: 'elimina', style: 'destructive' },
      ],
    });
    if (choice === 'duplica') actions.duplicateRoutine(id);
    if (choice === 'elimina') await confirmDelete(id, name);
  };

  return (
    <Screen withTabBar>
      <View style={styles.header}>
        <View style={styles.headerText}>
          <ThemedText type="title">Schede</ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            {routines.length === 1 ? '1 scheda' : `${routines.length} schede`}
          </ThemedText>
        </View>
        <IconButton
          icon="add-circle"
          size={30}
          color={theme.accent}
          accessibilityLabel="Nuova scheda"
          onPress={() => router.push('/scheda/nuova')}
        />
      </View>

      {routines.length === 0 ? (
        <EmptyState
          icon="clipboard-outline"
          title="Nessuna scheda"
          message="Le schede sono i tuoi programmi: esercizi, serie e recuperi già pronti."
          action={
            <Button label="Crea la prima" icon="add" onPress={() => router.push('/scheda/nuova')} />
          }
        />
      ) : (
        routines.map((routine) => (
          <Card
            key={routine.id}
            onPress={() => router.push({ pathname: '/scheda/[id]', params: { id: routine.id } })}
            onLongPress={() => openActions(routine.id, routine.name)}>
            <View style={styles.rowBetween}>
              <View style={styles.flexShrink}>
                <View style={styles.titleRow}>
                  <ThemedText type="subtitle">{routine.name}</ThemedText>
                  {routine.generated ? (
                    <ThemedText type="captionBold" themeColor="accent">
                      PROGRAMMA
                    </ThemedText>
                  ) : null}
                </View>
                {routine.description ? (
                  <ThemedText type="small" themeColor="textSecondary">
                    {routine.description}
                  </ThemedText>
                ) : null}
              </View>
              <Ionicons name="chevron-forward" size={18} color={theme.textMuted} />
            </View>

            <View style={styles.chips}>
              {muscles(routine.id).map((muscle) => (
                <Chip key={muscle} label={muscle} />
              ))}
            </View>

            <View style={styles.footer}>
              <ThemedText type="caption" themeColor="textMuted">
                {routine.exercises.length} esercizi ·{' '}
                {routine.exercises.reduce((sum, e) => sum + e.sets, 0)} serie · {lastUse(routine.id)}
              </ThemedText>
              <Button
                label="Inizia"
                size="sm"
                onPress={() => {
                  actions.startSession(routine.id);
                  router.push('/sessione');
                }}
              />
            </View>
          </Card>
        ))
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two, flexWrap: 'wrap' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: Spacing.two,
  },
  headerText: { gap: 2 },
  rowBetween: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.three,
  },
  flexShrink: { flexShrink: 1, gap: 2 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.one + 2 },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.two,
    marginTop: Spacing.one,
  },
});
