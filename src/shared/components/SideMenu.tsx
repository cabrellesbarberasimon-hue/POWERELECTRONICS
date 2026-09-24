import { Ionicons } from '@expo/vector-icons';
import { router, type Href } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useI18n } from '@/i18n';
import { useSession } from '@/stores/session';
import { colors, fonts, radius, spacing } from '@/theme';

/**
 * Blue tab on the right edge of the mockups. Tapping it slides out the
 * Account / Courses / Certificates menu (Figure 1, "View Courses").
 */
export function SideMenu({ top = '40%' }: { top?: `${number}%` | number }) {
  const [open, setOpen] = useState(false);
  const { t } = useI18n();
  const role = useSession((s) => s.user?.role);

  const items: { icon: keyof typeof Ionicons.glyphMap; label: string; href: Href }[] = [
    { icon: 'person', label: t('drawer.account'), href: '/account' },
    { icon: 'document-text', label: t('drawer.courses'), href: '/university' },
    { icon: 'school', label: t('drawer.certificates'), href: '/certificates' },
    { icon: 'podium', label: t('drawer.ranking'), href: '/social/ranking' },
  ];
  if (role === 'admin' || role === 'instructor') items.push({ icon: 'settings', label: t('drawer.admin'), href: '/admin' });

  return (
    <>
      {open && <Pressable style={StyleSheet.absoluteFill} onPress={() => setOpen(false)} accessibilityLabel="close menu" />}
      <View style={[styles.wrap, { top }]} pointerEvents="box-none">
        {open && (
          <View style={styles.panel}>
            {items.map((it) => (
              <Pressable
                key={it.label}
                style={styles.item}
                accessibilityRole="button"
                accessibilityLabel={it.label}
                onPress={() => {
                  setOpen(false);
                  router.push(it.href);
                }}
              >
                <Ionicons name={it.icon} size={22} color={colors.white} />
                <Text style={styles.itemText}>{it.label}</Text>
              </Pressable>
            ))}
          </View>
        )}
        <Pressable
          onPress={() => setOpen((o) => !o)}
          style={styles.handle}
          accessibilityRole="button"
          accessibilityLabel="menu"
          hitSlop={{ left: 16, top: 8, bottom: 8 }}
        />
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  wrap: { position: 'absolute', right: 0, flexDirection: 'row', alignItems: 'center', zIndex: 50 },
  handle: { width: 10, height: 70, backgroundColor: colors.primary, borderTopLeftRadius: radius.sm, borderBottomLeftRadius: radius.sm },
  panel: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.sm,
    borderTopLeftRadius: radius.md,
    borderBottomLeftRadius: radius.md,
    marginRight: 0,
    elevation: 6,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  item: { alignItems: 'center', paddingVertical: spacing.sm, paddingHorizontal: spacing.md, gap: 2 },
  itemText: { color: colors.white, fontFamily: fonts.medium, fontSize: 10 },
});
