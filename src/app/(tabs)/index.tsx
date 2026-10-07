import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { LinfaBackdrop } from '@/components/linfa-backdrop';
import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/feedback';
import { LinfaTile, Ruler } from '@/components/ui/tile';
import { BottomTabInset, Colors, MaxContentWidth, Radius, Spacing } from '@/constants/theme';
import {
  addDays,
  formatDurationShort,
  formatNumber,
  formatRelativeDay,
  formatVolume,
  isSameDay,
  startOfWeek,
  WEEKDAYS_SHORT,
} from '@/lib/format';
import {
  sessionDurationSec,
  sessionSetCount,
  sessionVolume,
  sessionsInWeek,
  suggestedRoutineId,
} from '@/lib/stats';
import { useGym } from '@/store/gym-store';

export default function TodayScreen() {
  const { width } = useWindowDimensions();
  const { state, ready, actions, getRoutine } = useGym();
  const { sessions, routines, activeSession, settings, program } = state;

  const weekStart = startOfWeek(Date.now());
  const weekSessions = sessionsInWeek(sessions, weekStart);
  const weekVolume = weekSessions.reduce((sum, s) => sum + sessionVolume(s), 0);
  const previousVolume = sessionsInWeek(sessions, addDays(weekStart, -7)).reduce(
    (sum, s) => sum + sessionVolume(s),
    0,
  );
  const delta =
    previousVolume > 0 ? Math.round(((weekVolume - previousVolume) / previousVolume) * 100) : null;

  // Con un programma attivo la rotazione resta dentro le sue sedute.
  const rotation = (program?.routineIds ?? routines.map((r) => r.id)).filter((id) =>
    routines.some((routine) => routine.id === id),
  );
  const suggestedId = suggestedRoutineId(sessions, rotation);
  const suggested = suggestedId ? getRoutine(suggestedId) : undefined;
  const recent = sessions.slice(0, 3);

  const startRoutine = (routineId?: string) => {
    actions.startSession(routineId);
    router.push('/sessione');
  };

  /** La pillola sotto al numero: delta se c'è uno storico, altrimenti un invito. */
  const pillLabel = () => {
    if (weekVolume === 0) return 'Nessun allenamento questa settimana';
    if (delta === null) return 'Prima settimana registrata';
    if (delta === 0) return 'In linea con la settimana scorsa';
    return `${delta > 0 ? '+' : ''}${delta}% vs settimana scorsa`;
  };

  // Al primo avvio non si salta alle domande: si entra in casa propria, e il
  // questionario è un invito che sta dove un giorno staranno le schede.
  const senzaProgramma = ready && !state.profile;

  return (
    <View style={styles.root}>
      <View style={styles.backdrop} pointerEvents="none">
        <LinfaBackdrop width={width} />
      </View>

      <SafeAreaView edges={['top']} style={styles.flex}>
        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled">
          <View style={styles.topRow}>
            <View style={styles.avatar}>
              <ThemedText type="bodyBold">MC</ThemedText>
            </View>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Impostazioni"
              onPress={() => router.push('/impostazioni')}
              style={({ pressed }) => [styles.helpButton, pressed && styles.pressed]}>
              <Ionicons name="settings-outline" size={19} color="rgba(255,255,255,0.9)" />
            </Pressable>
          </View>

          <View style={styles.hero}>
            <ThemedText type="heading" style={styles.heroLabel}>
              Volume{'\n'}settimana
            </ThemedText>
            <View style={styles.numberRow}>
              <ThemedText
                type="display"
                style={styles.number}
                numberOfLines={1}
                adjustsFontSizeToFit
                minimumFontScale={0.5}>
                {formatNumber(Math.round(weekVolume))}
              </ThemedText>
              <ThemedText type="subtitle" style={styles.unit}>
                kg
              </ThemedText>
            </View>
            <View style={styles.pill}>
              <ThemedText type="bodyBold">{pillLabel()}</ThemedText>
            </View>
            <Ruler />
          </View>

          {activeSession ? (
            <Card accent>
              <View style={styles.rowBetween}>
                <View style={styles.flexShrink}>
                  <ThemedText type="captionBold" themeColor="accent">
                    ALLENAMENTO IN CORSO
                  </ThemedText>
                  <ThemedText type="subtitle">{activeSession.name}</ThemedText>
                  <ThemedText type="small" themeColor="textSecondary">
                    {formatDurationShort(sessionDurationSec(activeSession))} ·{' '}
                    {activeSession.exercises.length} esercizi
                  </ThemedText>
                </View>
                <Button label="Riprendi" size="sm" onPress={() => router.push('/sessione')} />
              </View>
            </Card>
          ) : null}

          {senzaProgramma ? null : (
          <Card>
            <View style={styles.rowBetween}>
              <View style={styles.flexShrink}>
                <ThemedText type="heading">La tua{'\n'}settimana</ThemedText>
                <ThemedText type="small" themeColor="textSecondary" style={styles.cardSub}>
                  {weekSessions.length} di {settings.weeklyGoal} allenamenti ·{' '}
                  {weekSessions.reduce((sum, s) => sum + sessionSetCount(s), 0)} serie
                </ThemedText>
              </View>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Vai ai progressi"
                onPress={() => router.push('/progressi')}
                style={({ pressed }) => [styles.goButton, pressed && styles.pressed]}>
                <Ionicons name="arrow-up" size={17} color={Colors.textSecondary} />
              </Pressable>
            </View>

            <View style={styles.weekRow}>
              {WEEKDAYS_SHORT.map((label, index) => {
                const day = addDays(weekStart, index);
                const trained = sessions.some((s) => s.endedAt && isSameDay(s.endedAt, day));
                const isToday = isSameDay(day, Date.now());
                return (
                  <View key={label} style={styles.dayColumn}>
                    <ThemedText type="caption" themeColor={isToday ? 'accent' : 'textMuted'}>
                      {label}
                    </ThemedText>
                    <View
                      style={[
                        styles.dayDot,
                        {
                          backgroundColor: trained ? Colors.accent : Colors.track,
                          borderColor: isToday ? Colors.accent : 'transparent',
                        },
                      ]}>
                      {trained ? (
                        <Ionicons name="checkmark" size={12} color={Colors.onAccent} />
                      ) : null}
                    </View>
                  </View>
                );
              })}
            </View>
          </Card>
          )}

          {senzaProgramma ? (
            <Card accent>
              <ThemedText type="captionBold" themeColor="accent">
                PER COMINCIARE
              </ThemedText>
              <ThemedText type="heading">Costruiamo il tuo programma</ThemedText>
              <ThemedText type="small" themeColor="textSecondary">
                Nove domande veloci — obiettivo, giorni, quanto tempo hai, dove ti alleni — e da
                lì costruisco le schede su misura, con esercizi, serie e carichi di partenza.
              </ThemedText>
              <Button
                label="Compila il questionario"
                icon="sparkles"
                full
                style={styles.heroAction}
                onPress={() => router.push('/questionario')}
              />
            </Card>
          ) : suggested ? (
            <View style={styles.tiles}>
              <LinfaTile
                title={suggested.name}
                action={`${suggested.exercises.reduce((sum, e) => sum + e.sets, 0)} serie`}
                onPress={() => startRoutine(suggested.id)}
              />
              <LinfaTile
                title="Progressi"
                action="Dettagli"
                tone="b"
                onPress={() => router.push('/progressi')}
              />
            </View>
          ) : (
            <EmptyState
              icon="clipboard-outline"
              title="Nessuna scheda"
              message="Crea la tua prima scheda per iniziare ad allenarti con un programma."
              action={
                <Button
                  label="Crea scheda"
                  icon="add"
                  size="sm"
                  onPress={() => router.push('/scheda/nuova')}
                />
              }
            />
          )}

          <Button
            label="Allenamento libero"
            variant={senzaProgramma ? 'ghost' : 'secondary'}
            icon="flash-outline"
            full
            onPress={() => startRoutine()}
          />

          {recent.length > 0 ? (
            <>
              <ThemedText type="captionBold" themeColor="textMuted" style={styles.sectionLabel}>
                ULTIMI ALLENAMENTI
              </ThemedText>
              {recent.map((session) => (
                <Card
                  key={session.id}
                  compact
                  onPress={() =>
                    router.push({ pathname: '/storico/[id]', params: { id: session.id } })
                  }>
                  <View style={styles.rowBetween}>
                    <View style={styles.flexShrink}>
                      <ThemedText type="bodyBold">{session.name}</ThemedText>
                      <ThemedText type="caption" themeColor="textSecondary">
                        {formatRelativeDay(session.endedAt ?? session.startedAt)} ·{' '}
                        {formatVolume(sessionVolume(session))} · {sessionSetCount(session)} serie
                      </ThemedText>
                    </View>
                    <Ionicons name="chevron-forward" size={18} color={Colors.textMuted} />
                  </View>
                </Card>
              ))}
            </>
          ) : ready ? (
            <EmptyState
              icon="time-outline"
              title="Ancora nessun allenamento"
              message="Quando concludi una sessione la trovi qui, con volume, serie e durata."
            />
          ) : null}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
  flex: { flex: 1 },
  backdrop: { position: 'absolute', top: 0, left: 0, right: 0 },
  content: {
    paddingHorizontal: Spacing.three,
    paddingBottom: BottomTabInset + Spacing.five,
    gap: Spacing.three,
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: Spacing.one,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#2C7A4F',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.7)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  helpButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.34)',
    backgroundColor: 'rgba(14,20,16,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: { opacity: 0.7 },
  hero: { alignItems: 'center', gap: Spacing.two },
  heroLabel: { textAlign: 'center', fontWeight: '500' },
  numberRow: { flexDirection: 'row', alignItems: 'flex-end', gap: Spacing.two },
  number: { fontSize: 76, lineHeight: 82, letterSpacing: -3, fontWeight: '800' },
  unit: { marginBottom: Spacing.three - 4, color: Colors.text },
  pill: {
    marginTop: Spacing.two,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(168,240,186,0.85)',
    backgroundColor: 'rgba(7,14,10,0.35)',
    borderRadius: Radius.pill,
    paddingHorizontal: Spacing.four - 2,
    paddingVertical: Spacing.two + 2,
  },
  rowBetween: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.three,
  },
  flexShrink: { flexShrink: 1, gap: 2 },
  cardSub: { marginTop: Spacing.two },
  goButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.backgroundSelected,
    alignItems: 'center',
    justifyContent: 'center',
  },
  weekRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: Spacing.three - 4,
  },
  dayColumn: { alignItems: 'center', gap: Spacing.one },
  dayDot: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tiles: { flexDirection: 'row', gap: Spacing.two + 4 },
  heroAction: { marginTop: Spacing.two },
  sectionLabel: { marginTop: Spacing.two },
});
