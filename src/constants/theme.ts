/**
 * Direzione visiva "Linfa": verde chiaro su grigio-verde.
 *
 * Il tema è unico per scelta di identità (niente variante chiara di sistema),
 * ma non è nero: il fondo è un grigio-verde profondo e le superfici salgono di
 * tono una sopra l'altra. Il verde resta la cosa più luminosa dello schermo, e
 * per questo attira l'occhio dove serve — il numero della settimana, il
 * pulsante che fa partire l'allenamento, la serie completata.
 */

import '@/global.css';

import { Platform } from 'react-native';

export const Colors = {
  text: '#F3F8F4',
  textSecondary: '#AEBDB3',
  textMuted: '#879688',
  background: '#18231D',
  backgroundElement: '#223029',
  backgroundSelected: '#2C3D34',
  border: '#36483D',
  accent: '#86EFAC',
  accentSoft: '#27402F',
  onAccent: '#0C2116',
  success: '#3FD1A4',
  successSoft: '#1B3A33',
  danger: '#FF7A80',
  dangerSoft: '#452429',
  track: '#2C3D34',
} as const;

export type ThemeColor = keyof typeof Colors;
export type Theme = typeof Colors;

/** Sfumature del verde, usate da tessere, anello e bagliore. */
export const Linfa = {
  tileA: ['#7BE09B', '#3E9A6A'] as const,
  tileB: ['#66D18B', '#2F8457'] as const,
  ring: ['#DCFBE4', '#86EFAC', '#3FA06B'] as const,
  glowHot: '#5BD98C',
  glowWarm: '#C6F7D2',
  glowDeep: '#2A8255',
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
