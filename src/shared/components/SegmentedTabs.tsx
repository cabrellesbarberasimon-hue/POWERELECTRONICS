import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, fonts, fontSize, spacing } from '@/theme';

export interface TabItem<K extends string> {
  key: K;
  label: string;
  icon?: keyof typeof Ionicons.glyphMap;
}

/**
 * Split tab bar from the mockups: active tab blue, inactive tab dark grey,
 * each with a chevron / icon (e.g. "Corporate | Community", "Training | Assistance").
 */
export function SegmentedTabs<K extends string>({
  items,
  value,
  onChange,
  leading,
}: {
  items: TabItem<K>[];
  value: K;
  onChange: (k: K) => void;
  leading?: React.ReactNode;
}) {
  return (
    <View style={styles.row} accessibilityRole="tablist">
      {leading}
      {items.map((it) => {
        const active = it.key === value;
        return (
          <Pressable
            key={it.key}
            accessibilityRole="tab"
            accessibilityState={{ selected: active }}
            onPress={() => onChange(it.key)}
            style={[styles.tab, { backgroundColor: active ? colors.primary : colors.darkTab }]}
          >
            <Ionicons name={it.icon ?? (active ? 'chevron-down' : 'chevron-forward')} size={16} color={colors.white} />
            <Text style={styles.label} numberOfLines={1}>
              {it.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'stretch' },
  tab: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: spacing.md, gap: 6 },
  label: { color: colors.white, fontFamily: fonts.semibold, fontSize: fontSize.md },
});
