import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, fonts, fontSize, spacing } from '@/theme';

interface HeaderProps {
  title: string;
  /** Show the home icon (as in the mockups' blue header). */
  home?: boolean;
  back?: boolean;
  onBack?: () => void;
  right?: ReactNode;
  /** Render the title in upper case breadcrumb style: COURSES/SOLAR/HEM */
  breadcrumb?: boolean;
  variant?: 'blue' | 'white';
}

export function Header({ title, home = true, back = true, onBack, right, breadcrumb, variant = 'blue' }: HeaderProps) {
  const insets = useSafeAreaInsets();
  const fg = variant === 'blue' ? colors.white : colors.primary;
  const goBack = onBack ?? (() => (router.canGoBack() ? router.back() : router.replace('/home')));
  return (
    <View style={[styles.bar, { paddingTop: insets.top + spacing.sm }, variant === 'blue' ? styles.blue : styles.white]}>
      {home && <HeaderIcon icon="home" color={fg} label="Home" onPress={() => router.dismissTo('/home')} />}
      {back && <HeaderIcon icon="arrow-undo" color={fg} label="Back" onPress={goBack} />}
      <Text
        style={[styles.title, { color: fg }, breadcrumb && styles.breadcrumb, variant === 'white' && styles.titleCentered]}
        numberOfLines={1}
        accessibilityRole="header"
      >
        {title}
      </Text>
      <View style={styles.right}>{right}</View>
    </View>
  );
}

export function HeaderIcon({
  icon,
  onPress,
  color = colors.white,
  label,
  size = 22,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  onPress?: () => void;
  color?: string;
  label: string;
  size?: number;
}) {
  return (
    <Pressable onPress={onPress} hitSlop={10} accessibilityRole="button" accessibilityLabel={label} style={styles.icon}>
      <Ionicons name={icon} size={size} color={color} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  bar: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.md, paddingBottom: spacing.sm, gap: spacing.xs },
  blue: { backgroundColor: colors.primary },
  white: { backgroundColor: colors.white },
  title: { flex: 1, fontFamily: fonts.semibold, fontSize: fontSize.md, marginLeft: spacing.xs },
  titleCentered: { textAlign: 'center' },
  breadcrumb: { textTransform: 'uppercase', letterSpacing: 0.4 },
  right: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  icon: { padding: 4 },
});
