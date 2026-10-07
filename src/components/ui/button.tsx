import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Radius, Spacing } from '@/constants/theme';
import { useHaptics } from '@/hooks/use-haptics';
import { useTheme } from '@/hooks/use-theme';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'success';
type Size = 'sm' | 'md' | 'lg';

type ButtonProps = {
  label: string;
  onPress: () => void;
  variant?: Variant;
  size?: Size;
  icon?: keyof typeof Ionicons.glyphMap;
  disabled?: boolean;
  full?: boolean;
  style?: StyleProp<ViewStyle>;
};

export function Button({
  label,
  onPress,
  variant = 'primary',
  size = 'md',
  icon,
  disabled,
  full,
  style,
}: ButtonProps) {
  const theme = useTheme();
  const haptics = useHaptics();

  const palette: Record<Variant, { bg: string; fg: string; border: string }> = {
    primary: { bg: theme.accent, fg: theme.onAccent, border: 'transparent' },
    secondary: { bg: theme.backgroundSelected, fg: theme.text, border: theme.border },
    ghost: { bg: 'transparent', fg: theme.textSecondary, border: 'transparent' },
    danger: { bg: theme.dangerSoft, fg: theme.danger, border: 'transparent' },
    success: { bg: theme.success, fg: '#FFFFFF', border: 'transparent' },
  };

  const sizing: Record<Size, { paddingVertical: number; paddingHorizontal: number; font: number }> =
    {
      sm: { paddingVertical: Spacing.two - 2, paddingHorizontal: Spacing.three - 4, font: 14 },
      md: { paddingVertical: Spacing.two + 2, paddingHorizontal: Spacing.four, font: 16 },
      lg: { paddingVertical: Spacing.three, paddingHorizontal: Spacing.four, font: 17 },
    };

  const colors = palette[variant];
  const dims = sizing[size];

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={() => {
        haptics.tap();
        onPress();
      }}
      style={({ pressed }) => [
        styles.button,
        {
          backgroundColor: colors.bg,
          borderColor: colors.border,
          paddingVertical: dims.paddingVertical,
          paddingHorizontal: dims.paddingHorizontal,
        },
        full && styles.full,
        disabled && styles.disabled,
        pressed && styles.pressed,
        style,
      ]}>
      <View style={styles.inner}>
        {icon ? <Ionicons name={icon} size={dims.font + 2} color={colors.fg} /> : null}
        <ThemedText style={{ color: colors.fg, fontSize: dims.font, fontWeight: '600' }}>
          {label}
        </ThemedText>
      </View>
    </Pressable>
  );
}

/** Pulsante circolare con sola icona, per le azioni secondarie nelle liste. */
export function IconButton({
  icon,
  onPress,
  color,
  size = 20,
  accessibilityLabel,
  style,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
  color?: string;
  size?: number;
  accessibilityLabel: string;
  style?: StyleProp<ViewStyle>;
}) {
  const theme = useTheme();
  const haptics = useHaptics();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      hitSlop={8}
      onPress={() => {
        haptics.tap();
        onPress();
      }}
      style={({ pressed }) => [styles.iconButton, pressed && styles.pressed, style]}>
      <Ionicons name={icon} size={size} color={color ?? theme.textSecondary} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    borderRadius: Radius.pill,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center',
  },
  inner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  full: { alignSelf: 'stretch' },
  pressed: { opacity: 0.7 },
  disabled: { opacity: 0.4 },
  iconButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
