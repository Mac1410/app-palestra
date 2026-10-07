import type { ReactNode } from 'react';
import {
  Pressable,
  StyleSheet,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type CardProps = {
  children: ReactNode;
  onPress?: () => void;
  onLongPress?: () => void;
  style?: StyleProp<ViewStyle>;
  /** Riduce il padding interno, per liste dense. */
  compact?: boolean;
  accent?: boolean;
};

export function Card({ children, onPress, onLongPress, style, compact, accent }: CardProps) {
  const theme = useTheme();
  const base: StyleProp<ViewStyle> = [
    styles.card,
    {
      backgroundColor: accent ? theme.accentSoft : theme.backgroundElement,
      borderColor: accent ? 'transparent' : theme.border,
      padding: compact ? Spacing.three - 2 : Spacing.three,
    },
    style,
  ];

  if (!onPress && !onLongPress) return <View style={base}>{children}</View>;

  return (
    <Pressable
      onPress={onPress}
      onLongPress={onLongPress}
      style={({ pressed }) => [base, pressed && styles.pressed]}>
      {children}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: Radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    gap: Spacing.two,
  },
  pressed: { opacity: 0.75 },
});
