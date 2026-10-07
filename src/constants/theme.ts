/**
 * Direzione visiva "Linfa": verde chiaro su fondo scuro.
 * L'app è deliberatamente a tema unico scuro — la palette è l'identità,
 * non una preferenza di sistema, quindi non esiste una variante chiara.
 */

import '@/global.css';

import { Platform } from 'react-native';

export const Colors = {
  text: '#FFFFFF',
  textSecondary: '#8E9A90',
  textMuted: '#6D7971',
  background: '#080B09',
  backgroundElement: '#141A16',
  backgroundSelected: '#1E2721',
  border: '#1F2821',
  accent: '#7BE495',
  accentSoft: '#10251A',
  onAccent: '#06160D',
  success: '#34C79A',
  successSoft: '#0F2A24',
  danger: '#FF6369',
  dangerSoft: '#3A1B1D',
  track: '#1E2721',
} as const;

export type ThemeColor = keyof typeof Colors;
export type Theme = typeof Colors;

/** Sfumature del verde, usate da tessere, anello e bagliore. */
export const Linfa = {
  tileA: ['#5FD68A', '#2C7A4F'] as const,
  tileB: ['#49C27A', '#1F5F3D'] as const,
  ring: ['#D4F8D0', '#7BE495', '#2E9E5B'] as const,
  glowHot: '#49D983',
  glowWarm: '#B6F3C0',
  glowDeep: '#1C7A48',
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
