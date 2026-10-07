/**
 * Direzione visiva "Ember": brace su nero.
 * L'app è deliberatamente a tema unico scuro — la palette è l'identità,
 * non una preferenza di sistema, quindi non esiste una variante chiara.
 */

import '@/global.css';

import { Platform } from 'react-native';

export const Colors = {
  text: '#FFFFFF',
  textSecondary: '#8B8583',
  textMuted: '#6F6967',
  background: '#0B0A0A',
  backgroundElement: '#1A1819',
  backgroundSelected: '#262223',
  border: '#232021',
  accent: '#FF6B2C',
  accentSoft: '#2A1610',
  onAccent: '#FFFFFF',
  success: '#3DD68C',
  successSoft: '#12301F',
  danger: '#FF6369',
  dangerSoft: '#3A1B1D',
  track: '#262223',
} as const;

export type ThemeColor = keyof typeof Colors;
export type Theme = typeof Colors;

/** Sfumature della brace, usate da tessere, anello e bagliore. */
export const Ember = {
  tileA: ['#E2481B', '#8E2A18'] as const,
  tileB: ['#C63A16', '#6E2314'] as const,
  ring: ['#FFB57A', '#FF7A32', '#D6280F'] as const,
  glowHot: '#FF5C1A',
  glowWarm: '#FFB058',
  glowDeep: '#D62010',
} as const;

export const Fonts = Platform.select({
  ios: {
    sans: 'system-ui',
    serif: 'ui-serif',
    rounded: 'ui-rounded',
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: 'var(--font-display)',
    serif: 'var(--font-serif)',
    rounded: 'var(--font-rounded)',
    mono: 'var(--font-mono)',
  },
});

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const;

export const Radius = {
  sm: 8,
  md: 12,
  lg: 18,
  xl: 26,
  pill: 999,
} as const;

export const BottomTabInset = Platform.select({ ios: 60, android: 80 }) ?? 0;
export const MaxContentWidth = 800;
