import { Colors, type Theme } from '@/constants/theme';

/**
 * L'app ha un solo tema, per scelta di direzione visiva.
 * L'hook resta per non spargere import di `Colors` in ogni componente.
 */
export function useTheme(): Theme {
  return Colors;
}
