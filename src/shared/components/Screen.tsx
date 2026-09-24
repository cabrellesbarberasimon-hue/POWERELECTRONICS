import type { ReactNode } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, spacing } from '@/theme';

/** Page container: optional header slot + scrollable or fixed body. */
export function Screen({
  header,
  children,
  scroll = true,
  padded = true,
  style,
  bg = colors.bg,
  footer,
}: {
  header?: ReactNode;
  children: ReactNode;
  scroll?: boolean;
  padded?: boolean;
  style?: StyleProp<ViewStyle>;
  bg?: string;
  footer?: ReactNode;
}) {
  const insets = useSafeAreaInsets();
  const content = [padded && styles.padded, !header && { paddingTop: insets.top + spacing.md }, style];
  return (
    <View style={[styles.root, { backgroundColor: bg }]}>
      {header}
      {scroll ? (
        <ScrollView contentContainerStyle={[content, { paddingBottom: insets.bottom + spacing.xxl }]} keyboardShouldPersistTaps="handled">
          {children}
        </ScrollView>
      ) : (
        <View style={[styles.fill, content]}>{children}</View>
      )}
      {footer && <View style={{ paddingBottom: insets.bottom }}>{footer}</View>}
    </View>
  );
}

export function Loading() {
  return (
    <View style={styles.loading}>
      <ActivityIndicator color={colors.primary} size="large" />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  fill: { flex: 1 },
  padded: { paddingHorizontal: spacing.lg, paddingTop: spacing.lg },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xxl },
});
