import { Ionicons } from '@expo/vector-icons';
import { router, Stack } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { RestTimerBar, useRestTimer } from '@/components/rest-timer';
import { ThemedText } from '@/components/themed-text';
import { Button, IconButton } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useDialog } from '@/components/ui/dialog';
import { EmptyState } from '@/components/ui/feedback';
import { NumberField } from '@/components/ui/input';
import { MaxContentWidth, Radius, Spacing } from '@/constants/theme';
import { useHaptics } from '@/hooks/use-haptics';
import { useTheme } from '@/hooks/use-theme';
import { formatDuration, formatVolume } from '@/lib/format';
import { exerciseVolume, lastPerformance, workingSets } from '@/lib/stats';
import { useGym } from '@/store/gym-store';

export default function SessionScreen() {
  const theme = useTheme();
  const dialog = useDialog();
  const haptics = useHaptics();
  const { state, ready, actions, getExercise } = useGym();
  const session = ready ? state.activeSession : null;
  const [elapsed, setElapsed] = useState(0);
  const timer = useRestTimer(() => haptics.success());

  // Cronometro dell'allenamento.
  useEffect(() => {
    if (!session) return;
    const tick = () => setElapsed(Math.round((Date.now() - session.startedAt) / 1000));
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [session]);

  if (!session) {
    return (
      <SafeAreaView style={[styles.flex, { backgroundColor: theme.background }]} edges={['bottom']}>
        <View style={styles.emptyWrap}>
          {ready ? (
            <EmptyState
              icon="barbell-outline"
              title="Nessun allenamento in corso"
              message="Avvia una scheda o un allenamento libero dalla schermata Oggi."
              action={
                <Button label="Torna indietro" variant="secondary" onPress={() => router.back()} />
              }
            />
          ) : (
            <ThemedText type="small" themeColor="textMuted">
              Caricamento…
            </ThemedText>
          )}
        </View>
      </SafeAreaView>
    );
  }

  const totalVolume = session.exercises.reduce((sum, e) => sum + exerciseVolume(e), 0);
  const doneSets = session.exercises.reduce((sum, e) => sum + workingSets(e).length, 0);
  // Le posizioni di allungamento non sono serie: fuori dal conteggio.
  const plannedSets = session.exercises
    .filter((e) => e.phase !== 'stretching')
    .reduce((sum, e) => sum + e.sets.length, 0);

  const finish = async () => {
    if (doneSets === 0) {
      await dialog.notify({
        title: 'Nessuna serie completata',
        message: 'Segna almeno una serie come completata, oppure annulla l’allenamento.',
      });
      return;
    }
    const ok = await dialog.confirm({
      title: 'Terminare l’allenamento?',
      message: `${doneSets} serie · ${formatVolume(totalVolume)}`,
      confirmLabel: 'Termina',
      cancelLabel: 'Continua',
    });
    if (!ok) return;
    haptics.success();
    actions.finishSession();
    timer.stop();
    router.replace('/progressi');
  };

  const cancel = async () => {
    const ok = await dialog.confirm({
      title: 'Annullare l’allenamento?',
      message: 'I dati inseriti andranno persi.',
      confirmLabel: 'Annulla allenamento',
      cancelLabel: 'Continua',
      destructive: true,
    });
    if (!ok) return;
    actions.cancelSession();
    timer.stop();
    router.replace('/');
  };

  const toggleSet = (sessionExerciseId: string, setId: string, done: boolean, restSec: number) => {
    actions.patchSet(sessionExerciseId, setId, { done });
    if (done) {
      haptics.tap();
      if (state.settings.autoRest && restSec > 0) timer.start(restSec);
    }
  };

  return (
    <SafeAreaView style={[styles.flex, { backgroundColor: theme.background }]} edges={['bottom']}>
      <Stack.Screen
        options={{
          title: session.name,
          headerRight: () => (
            <Pressable onPress={cancel} hitSlop={8}>
              <ThemedText type="smallBold" style={{ color: theme.danger }}>
                Annulla
              </ThemedText>
            </Pressable>
          ),
        }}
      />

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={90}>
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          showsVerticalScrollIndicator={false}>
          <Card>
            <View style={styles.summary}>
              <View style={styles.summaryItem}>
                <ThemedText type="captionBold" themeColor="textMuted">
                  DURATA
                </ThemedText>
                <ThemedText type="heading">{formatDuration(elapsed)}</ThemedText>
              </View>
              <View style={styles.summaryItem}>
                <ThemedText type="captionBold" themeColor="textMuted">
                  VOLUME
                </ThemedText>
                <ThemedText type="heading">{formatVolume(totalVolume)}</ThemedText>
              </View>
              <View style={styles.summaryItem}>
                <ThemedText type="captionBold" themeColor="textMuted">
                  SERIE
                </ThemedText>
                <ThemedText type="heading">
                  {doneSets}/{plannedSets}
                </ThemedText>
              </View>
            </View>
          </Card>

          {session.exercises.length === 0 ? (
            <EmptyState
              icon="add-circle-outline"
              title="Allenamento vuoto"
              message="Aggiungi gli esercizi che stai per eseguire."
            />
          ) : null}

          {session.exercises.map((item, exerciseIndex) => {
            const exercise = getExercise(item.exerciseId);

            // Il defaticamento ha una riga sua: niente carichi, solo il tempo
            // di tenuta e la spunta.
            if (item.phase === 'stretching') {
              const apreSezione = session.exercises[exerciseIndex - 1]?.phase !== 'stretching';
              const set = item.sets[0];

              return (
                <View key={item.id} style={styles.stretchBlock}>
                  {apreSezione ? (
                    <View style={styles.stretchIntro}>
                      <ThemedText type="captionBold" themeColor="accent">
                        DEFATICAMENTO
                      </ThemedText>
                      <ThemedText type="caption" themeColor="textSecondary">
                        I muscoli di oggi più collo e spalle, contro la testa che va avanti.
                        Trenta secondi a posizione, senza rimbalzi, respirando.
                      </ThemedText>
                    </View>
                  ) : null}

                  <Card compact>
                    <View style={styles.stretchRow}>
                      <Pressable
                        accessibilityLabel={set?.done ? 'Fatto' : 'Segna come fatto'}
                        onPress={() => set && actions.patchSet(item.id, set.id, { done: !set.done })}
                        style={[
                          styles.checkBox,
                          { backgroundColor: set?.done ? theme.success : theme.backgroundSelected },
                        ]}>
                        <Ionicons
                          name="checkmark"
                          size={18}
                          color={set?.done ? '#FFFFFF' : theme.textMuted}
                        />
                      </Pressable>

                      <View style={styles.flexShrink}>
                        <ThemedText type="bodyBold">
                          {exercise?.name ?? 'Esercizio rimosso'}
                        </ThemedText>
                        {exercise?.notes ? (
                          <ThemedText type="caption" themeColor="textSecondary">
                            {exercise.notes}
                          </ThemedText>
                        ) : null}
                      </View>

                      <ThemedText type="mono" themeColor="textSecondary">
                        {item.targetReps}
                      </ThemedText>
                    </View>
                  </Card>
                </View>
              );
            }
            const previous = lastPerformance(state.sessions, item.exerciseId);
            const best = previous?.sets.reduce(
              (top, set) => (set.weight > top.weight ? set : top),
              previous.sets[0],
            );

            return (
              <Card key={item.id}>
                <View style={styles.exerciseHeader}>
                  <View style={styles.flexShrink}>
                    {/* Il nome apre la scheda dell'esercizio: muscoli coinvolti,
                        esecuzione e storico, senza uscire dall'allenamento. */}
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel={`Scheda di ${exercise?.name ?? 'esercizio'}`}
                      onPress={() =>
                        router.push({
                          pathname: '/esercizio/[id]',
                          params: { id: item.exerciseId },
                        })
                      }
                      style={styles.nameRow}>
                      <ThemedText type="subtitle" numberOfLines={2} style={styles.flexShrink}>
                        {exercise?.name ?? 'Esercizio rimosso'}
                      </ThemedText>
                      <Ionicons name="information-circle-outline" size={17} color={theme.textMuted} />
                    </Pressable>
                    <ThemedText type="caption" themeColor="textSecondary">
                      {item.targetReps ? `Obiettivo ${item.targetReps} rip · ` : ''}
                      recupero {item.restSec}s
                      {best ? ` · ultima ${best.weight} kg × ${best.reps}` : ''}
                    </ThemedText>
                    {item.advice ? (
                      <ThemedText type="caption" themeColor="accent" style={styles.advice}>
                        {item.advice}
                      </ThemedText>
                    ) : null}
                  </View>
                  <IconButton
                    icon="close"
                    accessibilityLabel="Rimuovi esercizio"
                    onPress={async () => {
                      const ok = await dialog.confirm({
                        title: 'Rimuovere l’esercizio?',
                        message: exercise?.name,
                        confirmLabel: 'Rimuovi',
                        destructive: true,
                      });
                      if (ok) actions.removeSessionExercise(item.id);
                    }}
                  />
                </View>

                <View style={styles.tableHeader}>
                  <ThemedText type="caption" themeColor="textMuted" style={styles.colIndex}>
                    #
                  </ThemedText>
                  <ThemedText type="caption" themeColor="textMuted" style={styles.colField}>
                    KG
                  </ThemedText>
                  <ThemedText type="caption" themeColor="textMuted" style={styles.colField}>
                    RIP
                  </ThemedText>
                  <ThemedText type="caption" themeColor="textMuted" style={styles.colTarget}>
                    OBIETT.
                  </ThemedText>
                  <View style={styles.colCheck} />
                  <View style={styles.colRemove} />
                </View>

                {item.sets.map((set, setIndex) => (
                  <View key={set.id} style={styles.setRow}>
                    <Pressable
                      onPress={() =>
                        actions.patchSet(item.id, set.id, { warmup: !set.warmup })
                      }
                      style={styles.colIndex}>
                      <ThemedText
                        type="smallBold"
                        themeColor={set.warmup ? 'textMuted' : 'text'}
                        style={styles.center}>
                        {set.warmup ? 'W' : setIndex + 1}
                      </ThemedText>
                    </Pressable>

                    <View style={styles.colField}>
                      <NumberField
                        value={set.weight}
                        decimals
                        placeholder="0"
                        onChangeValue={(value) =>
                          actions.patchSet(item.id, set.id, { weight: value })
                        }
                      />
                    </View>

                    <View style={styles.colField}>
                      <NumberField
                        value={set.reps}
                        placeholder="0"
                        onChangeValue={(value) => actions.patchSet(item.id, set.id, { reps: value })}
                      />
                    </View>

                    <View style={styles.colTarget}>
                      {set.targetReps ? (
                        <ThemedText
                          type="smallBold"
                          themeColor={
                            !set.done
                              ? 'textMuted'
                              : set.reps >= set.targetReps
                                ? 'success'
                                : 'danger'
                          }
                          style={styles.center}>
                          {set.toFailure ? `${set.targetReps}+` : set.targetReps}
                        </ThemedText>
                      ) : (
                        <ThemedText type="small" themeColor="textMuted" style={styles.center}>
                          —
                        </ThemedText>
                      )}
                    </View>

                    <Pressable
                      accessibilityLabel={set.done ? 'Serie completata' : 'Segna come completata'}
                      onPress={() => toggleSet(item.id, set.id, !set.done, item.restSec)}
                      style={[
                        styles.colCheck,
                        styles.checkBox,
                        {
                          backgroundColor: set.done ? theme.success : theme.backgroundSelected,
                        },
                      ]}>
                      <Ionicons
                        name="checkmark"
                        size={18}
                        color={set.done ? '#FFFFFF' : theme.textMuted}
                      />
                    </Pressable>

                    <IconButton
                      icon="remove-circle-outline"
                      size={18}
                      accessibilityLabel="Elimina serie"
                      style={styles.colRemove}
                      onPress={() => actions.removeSet(item.id, set.id)}
                    />
                  </View>
                ))}

                {item.sets.some((set) => set.toFailure) ? (
                  <ThemedText type="caption" themeColor="textMuted">
                    L’ultima serie è a cedimento: vai fin dove arrivi e scrivi quante ne hai
                    fatte. È il numero su cui il programma decide la prossima volta.
                  </ThemedText>
                ) : null}

                <View style={styles.exerciseFooter}>
                  <Button
                    label="Serie"
                    icon="add"
                    size="sm"
                    variant="secondary"
                    onPress={() => actions.addSet(item.id)}
                  />
                  <Button
                    label={`Recupero ${item.restSec}s`}
                    icon="timer-outline"
                    size="sm"
                    variant="ghost"
                    onPress={() => timer.start(item.restSec)}
                  />
                </View>

                <TextInput
                  value={item.note ?? ''}
                  onChangeText={(text) => actions.patchSessionExercise(item.id, { note: text })}
                  placeholder="Note (sensazioni, tecnica, carico…)"
                  placeholderTextColor={theme.textMuted}
                  style={[
                    styles.note,
                    { backgroundColor: theme.backgroundSelected, color: theme.text },
                  ]}
                />
              </Card>
            );
          })}

          <Button
            label="Aggiungi esercizio"
            icon="add"
            variant="secondary"
            full
            onPress={() => router.push('/aggiungi-esercizi')}
          />

          <TextInput
            value={session.notes ?? ''}
            onChangeText={(text) => actions.patchSession({ notes: text })}
            placeholder="Note sull'allenamento"
            placeholderTextColor={theme.textMuted}
            multiline
            style={[
              styles.sessionNote,
              { backgroundColor: theme.backgroundElement, color: theme.text, borderColor: theme.border },
            ]}
          />
        </ScrollView>

        <View style={[styles.footer, { borderTopColor: theme.border, backgroundColor: theme.background }]}>
          {timer.running ? <RestTimerBar timer={timer} /> : null}
          <Button label="Termina allenamento" icon="checkmark-done" variant="success" full onPress={finish} />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  emptyWrap: { flex: 1, justifyContent: 'center', padding: Spacing.three },
  content: {
    padding: Spacing.three,
    gap: Spacing.three,
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
  },
  summary: { flexDirection: 'row', justifyContent: 'space-between' },
  summaryItem: { gap: 2, alignItems: 'flex-start' },
  exerciseHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: Spacing.two,
  },
  flexShrink: { flexShrink: 1, gap: 2 },
  tableHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    paddingHorizontal: Spacing.half,
  },
  setRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    paddingHorizontal: Spacing.half,
  },
  colIndex: { width: 24, alignItems: 'center' },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  advice: { marginTop: 2 },
  stretchBlock: { gap: Spacing.two },
  stretchIntro: { gap: 2, marginTop: Spacing.two },
  stretchRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.three },
  colTarget: { width: 46, alignItems: 'center', justifyContent: 'center' },
  colField: { flex: 1 },
  colCheck: { width: 44, height: 36 },
  colRemove: { width: 30 },
  center: { textAlign: 'center' },
  checkBox: {
    borderRadius: Radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  exerciseFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.two,
    marginTop: Spacing.one,
  },
  note: {
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.three - 4,
    paddingVertical: Spacing.two,
    fontSize: 14,
  },
  sessionNote: {
    borderRadius: Radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: Spacing.three - 4,
    paddingVertical: Spacing.two + 2,
    fontSize: 15,
    minHeight: 88,
    textAlignVertical: 'top',
  },
  footer: {
    paddingHorizontal: Spacing.three,
    paddingTop: Spacing.two,
    paddingBottom: Spacing.two,
    borderTopWidth: StyleSheet.hairlineWidth,
    gap: Spacing.two,
  },
});
