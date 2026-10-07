import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, TextInput, View, type TextInputProps } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type FieldProps = TextInputProps & {
  label?: string;
  hint?: string;
};

export function Field({ label, hint, style, ...rest }: FieldProps) {
  const theme = useTheme();

  return (
    <View style={styles.field}>
      {label ? (
        <ThemedText type="captionBold" themeColor="textMuted">
          {label.toUpperCase()}
        </ThemedText>
      ) : null}
      <TextInput
        placeholderTextColor={theme.textMuted}
        style={[
          styles.input,
          {
            backgroundColor: theme.backgroundElement,
            borderColor: theme.border,
            color: theme.text,
          },
          style,
        ]}
        {...rest}
      />
      {hint ? (
        <ThemedText type="caption" themeColor="textMuted">
          {hint}
        </ThemedText>
      ) : null}
    </View>
  );
}

/** Campo numerico compatto usato nella griglia delle serie. */
export function NumberField({
  value,
  onChangeValue,
  placeholder,
  decimals = false,
  align = 'center',
  editable = true,
}: {
  value: number;
  onChangeValue: (value: number) => void;
  placeholder?: string;
  decimals?: boolean;
  align?: 'center' | 'left';
  editable?: boolean;
}) {
  const theme = useTheme();

  return (
    <TextInput
      value={value === 0 ? '' : String(value)}
      editable={editable}
      onChangeText={(text) => {
        const normalized = text.replace(',', '.').replace(/[^0-9.]/g, '');
        const parsed = decimals ? parseFloat(normalized) : parseInt(normalized, 10);
        onChangeValue(Number.isFinite(parsed) ? parsed : 0);
      }}
      keyboardType={decimals ? 'decimal-pad' : 'number-pad'}
      placeholder={placeholder}
      placeholderTextColor={theme.textMuted}
      selectTextOnFocus
      style={[
        styles.numberField,
        {
          backgroundColor: theme.backgroundSelected,
          color: theme.text,
          textAlign: align,
        },
      ]}
    />
  );
}

/** Stepper +/- per valori interi (serie, obiettivi, secondi di recupero). */
export function Stepper({
  value,
  onChange,
  step = 1,
  min = 0,
  max = 999,
  format,
}: {
  value: number;
  onChange: (value: number) => void;
  step?: number;
  min?: number;
  max?: number;
  format?: (value: number) => string;
}) {
  const theme = useTheme();
  const clamp = (next: number) => Math.min(max, Math.max(min, next));

  return (
    <View style={[styles.stepper, { backgroundColor: theme.backgroundSelected }]}>
      <Pressable
        accessibilityLabel="Diminuisci"
        hitSlop={6}
        onPress={() => onChange(clamp(value - step))}
        style={styles.stepperButton}>
        <Ionicons name="remove" size={18} color={theme.text} />
      </Pressable>
      <ThemedText type="bodyBold" style={styles.stepperValue}>
        {format ? format(value) : value}
      </ThemedText>
      <Pressable
        accessibilityLabel="Aumenta"
        hitSlop={6}
        onPress={() => onChange(clamp(value + step))}
        style={styles.stepperButton}>
        <Ionicons name="add" size={18} color={theme.text} />
      </Pressable>
    </View>
  );
}

export function SearchBar({
  value,
  onChangeText,
  placeholder = 'Cerca',
}: {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
}) {
  const theme = useTheme();

  return (
    <View
      style={[
        styles.search,
        { backgroundColor: theme.backgroundElement, borderColor: theme.border },
      ]}>
      <Ionicons name="search" size={17} color={theme.textMuted} />
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={theme.textMuted}
        autoCorrect={false}
        style={[styles.searchInput, { color: theme.text }]}
      />
      {value.length > 0 ? (
        <Pressable accessibilityLabel="Cancella ricerca" onPress={() => onChangeText('')}>
          <Ionicons name="close-circle" size={17} color={theme.textMuted} />
        </Pressable>
      ) : null}
    </View>
  );
}

export function Toggle({
  label,
  description,
  value,
  onChange,
}: {
  label: string;
  description?: string;
  value: boolean;
  onChange: (value: boolean) => void;
}) {
  const theme = useTheme();

  return (
    <Pressable onPress={() => onChange(!value)} style={styles.toggleRow}>
      <View style={styles.toggleText}>
        <ThemedText type="bodyBold">{label}</ThemedText>
        {description ? (
          <ThemedText type="caption" themeColor="textSecondary">
            {description}
          </ThemedText>
        ) : null}
      </View>
      <View
        style={[
          styles.toggleTrack,
          { backgroundColor: value ? theme.accent : theme.track },
        ]}>
        <View style={[styles.toggleThumb, value && styles.toggleThumbOn]} />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  field: { gap: Spacing.one + 2 },
  input: {
    borderRadius: Radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: Spacing.three - 4,
    paddingVertical: Spacing.two + 2,
    fontSize: 16,
  },
  numberField: {
    borderRadius: Radius.sm,
    paddingHorizontal: Spacing.one,
    paddingVertical: Spacing.two - 2,
    fontSize: 16,
    fontWeight: '600',
    minWidth: 54,
  },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: Radius.pill,
    paddingHorizontal: Spacing.two - 2,
    paddingVertical: Spacing.half,
    gap: Spacing.two,
  },
  stepperButton: { padding: Spacing.one },
  stepperValue: { minWidth: 52, textAlign: 'center' },
  search: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    borderRadius: Radius.pill,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: Spacing.three - 4,
    paddingVertical: Spacing.two,
  },
  searchInput: { flex: 1, fontSize: 16, paddingVertical: 2 },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.three,
    paddingVertical: Spacing.two - 2,
  },
  toggleText: { flex: 1, gap: 2 },
  toggleTrack: {
    width: 50,
    height: 30,
    borderRadius: Radius.pill,
    padding: 3,
    justifyContent: 'center',
  },
  toggleThumb: {
    width: 24,
    height: 24,
    borderRadius: Radius.pill,
    backgroundColor: '#FFFFFF',
  },
  toggleThumbOn: { alignSelf: 'flex-end' },
});
