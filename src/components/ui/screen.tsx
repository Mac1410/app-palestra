import type { ReactNode } from 'react';
import { ScrollView, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { SafeAreaView, type Edge } from 'react-native-safe-area-context';

import { BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type ScreenProps = {
  children: ReactNode;
  /** Contenuto scrollabile (default) oppure layout fisso. */
  scroll?: boolean;
  /** Aggiunge spazio in fondo per la tab bar. */
  withTabBar?: boolean;
  edges?: Edge[];
  contentContainerStyle?: StyleProp<ViewStyle>;
  style?: StyleProp<ViewStyle>;
};

export function Screen({
  children,
  scroll = true,
  withTabBar = false,
  edges = ['top'],
  contentContainerStyle,
  style,
}: ScreenProps) {
  const theme = useTheme();
  const padding = [
    styles.content,
    withTabBar && { paddingBottom: BottomTabInset + Spacing.five },
    contentContainerStyle,
  ];

  return (
    <SafeAreaView edges={edges} style={[styles.flex, { backgroundColor: theme.background }, style]}>
      {scroll ? (
        <ScrollView
          style={styles.flex}
          contentContainerStyle={padding}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          showsVerticalScrollIndicator={false}>
          {children}
        </ScrollView>
      ) : (
        <View style={[styles.flex, padding]}>{children}</View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: {
    paddingHorizontal: Spacing.three,
    paddingBottom: Spacing.five,
    gap: Spacing.three,
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
  },
});
