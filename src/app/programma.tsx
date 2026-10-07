/**
 * Il programma generato: che suddivisione è stata scelta, perché, e come sono
 * fatte le sedute. Si apre alla fine del questionario e resta consultabile
 * dalle impostazioni.
 */

import { Ionicons } from '@expo/vector-icons';
import { router, Stack } from 'expo-router';

import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useDialog } from '@/components/ui/dialog';
import { EmptyState, SectionHeader } from '@/components/ui/feedback';
import { Screen } from '@/components/ui/screen';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useGym } from '@/store/gym-store';
import { SPLIT_LABELS } from '@/types';
import { StyleSheet, View } from 'react-native';

export default function ProgramScreen() {
  const theme = useTheme();
  const dialog = useDialog();
  const { state, actions, getExerciseName } = useGym();
  const { program, profile, routines } = state;

  const planned = program
    ? program.routineIds
        .map((id) => routines.find((routine) => routine.id === id))
        .filter((routine) => routine !== undefined)
    : [];

  if (!program || !profile) {
    return (
      <Screen>
        <Stack.Screen options={{ title: 'Programma' }} />
        <EmptyState
          icon="sparkles-outline"
          title="Nessun programma"
          message="Compila il questionario e costruisco le schede su misura."
          action={<Button label="Compila il questionario" onPress={() => router.push('/questionario')} />}
        />
      </Screen>
    );
  }

  const regenerate = async () => {
    const ok = await dialog.confirm({
      title: 'Rifare le schede?',
      message:
        'Le schede del programma vengono ricostruite dalle stesse risposte. Le modifiche che hai fatto a mano su queste schede andranno perse.',
      confirmLabel: 'Rifai',
    });
    if (ok) actions.regenerateProgram();
  };

  return (
    <Screen>
      <Stack.Screen options={{ title: 'Programma' }} />

      <View style={styles.hero}>
        <ThemedText type="captionBold" themeColor="accent">
          IL TUO PROGRAMMA
        </ThemedText>
        <ThemedText type="title">{SPLIT_LABELS[program.split]}</ThemedText>
        <ThemedText type="small" themeColor="textSecondary">
          {profile.daysPerWeek} allenamenti a settimana · {profile.sessionMinutes} minuti l’uno
        </ThemedText>
      </View>

      <Card accent>
        <View style={styles.reasons}>
          {program.rationale.map((reason) => (
            <View key={reason} style={styles.reason}>
              <Ionicons name="ellipse" size={6} color={theme.accent} style={styles.bullet} />
              <ThemedText type="small" style={styles.reasonText}>
                {reason}
              </ThemedText>
            </View>
          ))}
        </View>
      </Card>

      <SectionHeader title="Le sedute" subtitle="Ruotano in quest’ordine, una per allenamento" />

      {planned.map((routine, index) => (
        <Card key={routine.id} onPress={() => router.push({ pathname: '/scheda/[id]', params: { id: routine.id } })}>
          <View style={styles.routineHeader}>
            <View style={styles.routineTitles}>
              <ThemedText type="captionBold" themeColor="textMuted">
                {index + 1}ª SEDUTA
              </ThemedText>
              <ThemedText type="heading">{routine.name}</ThemedText>
              {routine.description ? (
                <ThemedText type="caption" themeColor="textSecondary">
                  {routine.description}
                </ThemedText>
              ) : null}
            </View>
            <Ionicons name="chevron-forward" size={18} color={theme.textMuted} />
          </View>

          <View style={styles.exercises}>
            {routine.exercises.map((item) => (
              <View key={item.id} style={styles.exerciseRow}>
                <ThemedText type="small" style={styles.exerciseName}>
                  {getExerciseName(item.exerciseId)}
                </ThemedText>
                <ThemedText type="caption" themeColor="textSecondary">
                  {item.sets}×{item.reps}
                  {item.weight ? ` · ${item.weight} kg` : ''}
                </ThemedText>
              </View>
            ))}
          </View>
        </Card>
      ))}

      {planned.some((routine) => routine.exercises.some((item) => item.weight)) ? (
        <ThemedText type="caption" themeColor="textMuted">
          I carichi indicati sono una proposta di partenza calcolata sul tuo peso corporeo, e per i
          manubri si intendono per singolo manubrio. La prima volta trattali come una prova:
          correggerli è normale, e da lì in poi contano i pesi che usi davvero.
        </ThemedText>
      ) : null}

      <Button label="Comincia" icon="play" full onPress={() => router.replace('/')} />
      <Button label="Rifai le schede" variant="secondary" full onPress={() => void regenerate()} />
      <Button
        label="Cambia le risposte"
        variant="ghost"
        full
        onPress={() => router.push('/questionario')}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: { gap: Spacing.one, marginTop: Spacing.two },
  reasons: { gap: Spacing.two },
  reason: { flexDirection: 'row', gap: Spacing.two, alignItems: 'flex-start' },
  bullet: { marginTop: 7 },
  reasonText: { flex: 1 },
  routineHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.two },
  routineTitles: { flex: 1, gap: 2 },
  exercises: { gap: Spacing.one, marginTop: Spacing.two },
  exerciseRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.three,
  },
  exerciseName: { flex: 1 },
});
