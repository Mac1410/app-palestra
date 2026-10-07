import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Card } from '@/components/ui/card';
import { useDialog } from '@/components/ui/dialog';
import { EmptyState, SectionHeader } from '@/components/ui/feedback';
import { Screen } from '@/components/ui/screen';
import { BarChart, ProgressBar, StatTile } from '@/components/ui/stats';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import {
  addDays,
  formatDurationShort,
  formatRelativeDay,
  formatShortDate,
  formatVolume,
  startOfDay,
} from '@/lib/format';
import {
  activeDays,
  muscleDistribution,
  sessionDurationSec,
  sessionSetCount,
  sessionVolume,
  weeklyBuckets,
  weeklyStreak,
} from '@/lib/stats';
import { useGym } from '@/store/gym-store';

export default function ProgressScreen() {
  const theme = useTheme();
  const dialog = useDialog();
  const { state, actions, exercisesById } = useGym();
  const { sessions, settings } = state;

  const totalVolume = sessions.reduce((sum, s) => sum + sessionVolume(s), 0);
  const buckets = weeklyBuckets(sessions, 8);
  const distribution = muscleDistribution(
    sessions,
    exercisesById,
    addDays(startOfDay(Date.now()), -29),
  );
  const maxSets = Math.max(...distribution.map((d) => d.sets), 1);

  const confirmDelete = async (id: string, name: string) => {
    const ok = await dialog.confirm({
      title: 'Eliminare l’allenamento?',
      message: `"${name}" verrà rimosso dallo storico.`,
      confirmLabel: 'Elimina',
      destructive: true,
    });
    if (ok) actions.deleteSessionFromHistory(id);
  };

  return (
    <Screen withTabBar>
      <View style={styles.header}>
        <ThemedText type="title">Progressi</ThemedText>
        <ThemedText type="small" themeColor="textSecondary">
          {sessions.length === 1 ? '1 allenamento' : `${sessions.length} allenamenti`} registrati
        </ThemedText>
      </View>

      <View style={styles.tiles}>
        <StatTile
          label="Volume totale"
          value={formatVolume(totalVolume)}
          icon="barbell"
          tone="accent"
        />
        <StatTile
          label="Giorni attivi"
          value={`${activeDays(sessions, 30)}/30`}
          icon="calendar"
          hint="Ultimi 30 giorni"
        />
        <StatTile
          label="Striscia"
          value={`${weeklyStreak(sessions, settings.weeklyGoal)}`}
          icon="flame"
          hint="Settimane a obiettivo"
        />
        <StatTile
          label="Serie totali"
          value={String(sessions.reduce((sum, s) => sum + sessionSetCount(s), 0))}
          icon="repeat"
        />
      </View>

      <SectionHeader title="Volume settimanale" subtitle="Ultime 8 settimane" />
      <Card>
        <BarChart
          data={buckets.map((bucket, index) => ({
            label: formatShortDate(bucket.weekStart),
            value: Math.round(bucket.volume),
            highlight: index === buckets.length - 1,
          }))}
          formatValue={(value) => (value > 0 ? formatVolume(value) : '—')}
        />
      </Card>

      <SectionHeader title="Gruppi muscolari" subtitle="Serie negli ultimi 30 giorni" />
      {distribution.length === 0 ? (
        <EmptyState
          icon="pie-chart-outline"
          title="Nessun dato"
          message="Completa qualche allenamento per vedere come distribuisci il lavoro."
        />
      ) : (
        <Card>
          {distribution.map((item) => (
            <View key={item.muscle} style={styles.distributionRow}>
              <View style={styles.rowBetween}>
                <ThemedText type="small">{item.muscle}</ThemedText>
                <ThemedText type="caption" themeColor="textSecondary">
                  {item.sets} serie · {formatVolume(item.volume)}
                </ThemedText>
              </View>
              <ProgressBar value={item.sets} max={maxSets} />
            </View>
          ))}
        </Card>
      )}

      <SectionHeader title="Storico" />
      {sessions.length === 0 ? (
        <EmptyState
          icon="time-outline"
          title="Storico vuoto"
          message="Gli allenamenti conclusi finiscono qui, con tutti i dettagli delle serie."
        />
      ) : (
        sessions.map((session) => (
          <Card
            key={session.id}
            compact
            onPress={() => router.push({ pathname: '/storico/[id]', params: { id: session.id } })}
            onLongPress={() => confirmDelete(session.id, session.name)}>
            <View style={styles.rowBetween}>
              <View style={styles.flexShrink}>
                <ThemedText type="bodyBold">{session.name}</ThemedText>
                <ThemedText type="caption" themeColor="textSecondary">
                  {formatRelativeDay(session.endedAt ?? session.startedAt)} ·{' '}
                  {formatDurationShort(sessionDurationSec(session))} ·{' '}
                  {formatVolume(sessionVolume(session))}
                </ThemedText>
              </View>
              <Ionicons name="chevron-forward" size={18} color={theme.textMuted} />
            </View>
          </Card>
        ))
      )}
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
    gap: Spacing.three,
  },
  flexShrink: { flexShrink: 1, gap: 2 },
  distributionRow: { gap: Spacing.one, paddingVertical: Spacing.one },
});
