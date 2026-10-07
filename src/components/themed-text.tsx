import { StyleSheet, Text, type TextProps } from 'react-native';

import { Fonts, type ThemeColor } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export type TextVariant =
  | 'display'
  | 'title'
  | 'heading'
  | 'subtitle'
  | 'body'
  | 'bodyBold'
  | 'small'
  | 'smallBold'
  | 'caption'
  | 'captionBold'
  | 'mono';

export type ThemedTextProps = TextProps & {
  type?: TextVariant;
  themeColor?: ThemeColor;
};

export function ThemedText({ style, type = 'body', themeColor, ...rest }: ThemedTextProps) {
  const theme = useTheme();

  return (
    <Text
      style={[{ color: theme[themeColor ?? 'text'] }, styles[type], style]}
      {...rest}
    />
  );
}

const styles = StyleSheet.create({
  display: { fontSize: 40, lineHeight: 44, fontWeight: '800', letterSpacing: -0.8 },
  title: { fontSize: 30, lineHeight: 36, fontWeight: '700', letterSpacing: -0.5 },
  heading: { fontSize: 21, lineHeight: 27, fontWeight: '700', letterSpacing: -0.3 },
  subtitle: { fontSize: 17, lineHeight: 23, fontWeight: '600' },
  body: { fontSize: 16, lineHeight: 23, fontWeight: '400' },
  bodyBold: { fontSize: 16, lineHeight: 23, fontWeight: '600' },
  small: { fontSize: 14, lineHeight: 20, fontWeight: '400' },
  smallBold: { fontSize: 14, lineHeight: 20, fontWeight: '600' },
  caption: { fontSize: 12, lineHeight: 16, fontWeight: '500' },
  captionBold: { fontSize: 12, lineHeight: 16, fontWeight: '700', letterSpacing: 0.4 },
  mono: { fontFamily: Fonts.mono, fontSize: 13, fontWeight: '600' },
});
