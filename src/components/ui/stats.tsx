import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export function StatTile({
  label,
  value,
  hint,
  icon,
  tone = 'neutral',
}: {
  label: string;
  value: string;
  hint?: string;
  icon?: keyof typeof Ionicons.glyphMap;
  tone?: 'neutral' | 'accent';
}) {
  const theme = useTheme();
  const accent = tone === 'accent';

  return (
    <View
      style={[
        styles.tile,
        {
          backgroundColor: accent ? theme.accentSoft : theme.backgroundElement,
          borderColor: accent ? 'transparent' : theme.border,
        },
      ]}>
      <View style={styles.tileHeader}>
        {icon ? (
          <Ionicons name={icon} size={14} color={accent ? theme.accent : theme.textMuted} />
        ) : null}
        <ThemedText type="captionBold" themeColor={accent ? 'accent' : 'textMuted'}>
          {label.toUpperCase()}
        </ThemedText>
      </View>
      <ThemedText type="heading">{value}</ThemedText>
      {hint ? (
        <ThemedText type="caption" themeColor="textSecondary">
          {hint}
        </ThemedText>
      ) : null}
    </View>
  );
}

export function ProgressBar({
  value,
  max,
  tone = 'accent',
}: {
  value: number;
  max: number;
  tone?: 'accent' | 'success';
}) {
  const theme = useTheme();
  const ratio = max <= 0 ? 0 : Math.max(0, Math.min(1, value / max));

  return (
    <View style={[styles.track, { backgroundColor: theme.track }]}>
      <View
        style={[
          styles.fill,
          {
            width: `${ratio * 100}%`,
            backgroundColor: tone === 'success' ? theme.success : theme.accent,
          },
        ]}
      />
    </View>
  );
}

export type BarDatum = { label: string; value: number; highlight?: boolean };

/** Istogramma essenziale costruito con sole View: nessuna dipendenza grafica. */
export function BarChart({
  data,
  height = 120,
  formatValue,
}: {
  data: BarDatum[];
  height?: number;
  formatValue?: (value: number) => string;
}) {
  const theme = useTheme();
  const max = Math.max(...data.map((d) => d.value), 1);

  return (
    <View style={[styles.chart, { height: height + 34 }]}>
      {data.map((datum, index) => {
        const ratio = datum.value / max;
        return (
          <View key={`${datum.label}-${index}`} style={styles.barColumn}>
            <View style={[styles.barArea, { height }]}>
              <View
                style={[
                  styles.bar,
                  {
                    height: Math.max(datum.value > 0 ? 6 : 2, ratio * height),
                    backgroundColor: datum.highlight ? theme.accent : theme.track,
                  },
                ]}
              />
            </View>
            <ThemedText type="caption" themeColor="textMuted" numberOfLines={1}>
              {datum.label}
            </ThemedText>
            {formatValue ? (
              <ThemedText type="caption" themeColor={datum.highlight ? 'accent' : 'textMuted'}>
                {formatValue(datum.value)}
              </ThemedText>
            ) : null}
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  tile: {
    flex: 1,
    minWidth: 140,
    borderRadius: Radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    padding: Spacing.three - 2,
    gap: Spacing.one,
  },
  tileHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing.one },
  track: {
    height: 8,
    borderRadius: Radius.pill,
    overflow: 'hidden',
  },
  fill: { height: '100%', borderRadius: Radius.pill },
  chart: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: Spacing.one + 2,
  },
  barColumn: { flex: 1, alignItems: 'center', gap: Spacing.half },
  barArea: { justifyContent: 'flex-end', width: '100%', alignItems: 'center' },
  bar: { width: '78%', borderRadius: Radius.sm },
});
