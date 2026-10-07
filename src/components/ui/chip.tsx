import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export function Chip({
  label,
  selected,
  onPress,
  tone = 'neutral',
}: {
  label: string;
  selected?: boolean;
  onPress?: () => void;
  tone?: 'neutral' | 'accent' | 'success' | 'danger';
}) {
  const theme = useTheme();

  const tones = {
    neutral: { bg: theme.backgroundSelected, fg: theme.textSecondary },
    accent: { bg: theme.accentSoft, fg: theme.accent },
    success: { bg: theme.successSoft, fg: theme.success },
    danger: { bg: theme.dangerSoft, fg: theme.danger },
  } as const;

  const colors = selected ? { bg: theme.accent, fg: theme.onAccent } : tones[tone];
  const content = (
    <View style={[styles.chip, { backgroundColor: colors.bg }]}>
      <ThemedText type="caption" style={{ color: colors.fg }}>
        {label}
      </ThemedText>
    </View>
  );

  if (!onPress) return content;

  return (
    <Pressable onPress={onPress} style={({ pressed }) => pressed && styles.pressed}>
      {content}
    </Pressable>
  );
}

/** Riga di filtri scorrevole orizzontalmente. */
export function ChipRow<T extends string>({
  options,
  value,
  onChange,
  allLabel = 'Tutti',
}: {
  options: readonly T[];
  value: T | null;
  onChange: (value: T | null) => void;
  allLabel?: string;
}) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.row}>
      <Chip label={allLabel} selected={value === null} onPress={() => onChange(null)} />
      {options.map((option) => (
        <Chip
          key={option}
          label={option}
          selected={value === option}
          onPress={() => onChange(value === option ? null : option)}
        />
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  chip: {
    paddingHorizontal: Spacing.three - 4,
    paddingVertical: Spacing.one + 2,
    borderRadius: Radius.pill,
  },
  row: { gap: Spacing.two, paddingVertical: Spacing.half },
  pressed: { opacity: 0.7 },
});
