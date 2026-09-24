import { StyleSheet, Text, type TextProps } from 'react-native';
import { colors, fonts, fontSize } from '@/theme';

type Variant = 'hero' | 'title' | 'subtitle' | 'body' | 'caption' | 'label';

const styles = StyleSheet.create({
  hero: { fontFamily: fonts.bold, fontSize: fontSize.xxl, color: colors.text },
  title: { fontFamily: fonts.semibold, fontSize: fontSize.xl, color: colors.text },
  subtitle: { fontFamily: fonts.semibold, fontSize: fontSize.lg, color: colors.text },
  body: { fontFamily: fonts.regular, fontSize: fontSize.md, color: colors.text, lineHeight: 22 },
  caption: { fontFamily: fonts.regular, fontSize: fontSize.sm, color: colors.textMuted },
  label: { fontFamily: fonts.semibold, fontSize: fontSize.sm, color: colors.text, letterSpacing: 0.3 },
});

export function T({ variant = 'body', style, ...rest }: TextProps & { variant?: Variant }) {
  return <Text {...rest} style={[styles[variant], style]} />;
}
