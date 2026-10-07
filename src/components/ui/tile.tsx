import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Colors, Ember, Radius, Spacing } from '@/constants/theme';
import { useHaptics } from '@/hooks/use-haptics';

/** Tessera in gradiente brace, con etichetta a pillola bianca in basso. */
export function EmberTile({
  title,
  action,
  tone = 'a',
  onPress,
}: {
  title: string;
  action: string;
  tone?: 'a' | 'b';
  onPress: () => void;
}) {
  const haptics = useHaptics();
  const colors = tone === 'a' ? Ember.tileA : Ember.tileB;

  return (
    <Pressable
      accessibilityRole="button"
      onPress={() => {
        haptics.tap();
        onPress();
      }}
      style={({ pressed }) => [styles.tileWrap, pressed && styles.pressed]}>
      <LinearGradient
        colors={colors}
        start={tone === 'a' ? { x: 0, y: 0 } : { x: 1, y: 0 }}
        end={tone === 'a' ? { x: 1, y: 1 } : { x: 0, y: 1 }}
        style={styles.tile}>
        <ThemedText type="heading" style={styles.tileTitle}>
          {title}
        </ThemedText>
        <View style={styles.chip}>
          <ThemedText type="smallBold" style={styles.chipText}>
            {action}
          </ThemedText>
          <View style={styles.chipIcon}>
            <Ionicons name="arrow-forward" size={13} color="#FFFFFF" />
          </View>
        </View>
      </LinearGradient>
    </Pressable>
  );
}

/**
 * Righello a tacche sotto il numero principale: le ultime otto settimane,
 * con il segno più alto sulla corrente.
 */
export function Ruler({ ticks = 33 }: { ticks?: number }) {
  const middle = Math.floor(ticks / 2);

  return (
    <View style={styles.ruler} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      {Array.from({ length: ticks }, (_, i) => {
        const isMajor = i % 5 === 0;
        const isCenter = i === middle;
        return (
          <View
            key={i}
            style={[
              styles.tick,
              { height: isCenter ? 30 : isMajor ? 18 : 10 },
              isMajor && styles.tickMajor,
              isCenter && styles.tickCenter,
            ]}
          />
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  tileWrap: { flex: 1, borderRadius: Radius.xl, overflow: 'hidden' },
  pressed: { opacity: 0.8 },
  tile: {
    minHeight: 148,
    padding: Spacing.three + 2,
    justifyContent: 'space-between',
  },
  tileTitle: { color: '#FFFFFF' },
  chip: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    backgroundColor: '#FFFFFF',
    borderRadius: Radius.pill,
    paddingLeft: Spacing.three - 2,
    paddingRight: Spacing.one,
    paddingVertical: Spacing.one + 1,
  },
  chipText: { color: '#1A0F0A' },
  chipIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#1A0F0A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ruler: {
    alignSelf: 'stretch',
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    height: 30,
    paddingHorizontal: Spacing.five,
  },
  tick: {
    width: 1,
    backgroundColor: Colors.textMuted,
    borderRadius: 1,
  },
  tickMajor: { backgroundColor: '#7A5B4C' },
  tickCenter: { width: 1.5, backgroundColor: '#FFC79E' },
});
