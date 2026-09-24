import { Ionicons } from '@expo/vector-icons';
import { router, type Href } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useAlerts, useCourses, useLicense, usePosts, useUsers } from '@/hooks/api';
import { useI18n } from '@/i18n';
import { api } from '@/services';
import { useQuery } from '@tanstack/react-query';
import { progressPercent } from '@/modules/university/progress';
import { Header, Screen, SectionTitle } from '@/shared/components';
import { useUser } from '@/stores/session';
import { colors, fonts, fontSize, radius, spacing } from '@/theme';

/** Admin / evaluator dashboard. */
export default function AdminHome() {
  const { t } = useI18n();
  const me = useUser();
  const users = useUsers();
  const posts = usePosts();
  const alerts = useAlerts('freesun-hemk');
  const courses = useCourses();
  const license = useLicense();
  // Average course progress across all users (mock-only aggregate).
  const avg = useQuery({
    queryKey: ['university', 'avg', users.data?.length, courses.data?.length],
    enabled: !!users.data && !!courses.data,
    queryFn: async () => {
      const all = await Promise.all(users.data!.map((u) => api.university.listProgress(u.id)));
      const rows = all.flat();
      if (!rows.length) return 0;
      const pcts = rows.map((p) =>
        progressPercent(
          courses.data!.find((c) => c.id === p.courseId)!,
          p,
        ),
      );
      return Math.round(pcts.reduce((a, b) => a + b, 0) / pcts.length);
    },
  });

  const kpis: [string, string | number, keyof typeof Ionicons.glyphMap][] = [
    [t('admin.activeUsers'), users.data?.length ?? '—', 'people'],
    [t('admin.posts'), posts.data?.length ?? '—', 'chatbubbles'],
    [t('admin.avgProgress'), avg.data !== undefined ? `${avg.data}%` : '—', 'trending-up'],
    [t('admin.openAlerts'), alerts.data?.filter((a) => !a.resolved).length ?? '—', 'alert-circle'],
  ];

  const links: { href: Href; label: string; icon: keyof typeof Ionicons.glyphMap; adminOnly?: boolean }[] = [
    { href: '/admin/review', label: t('admin.review'), icon: 'star' },
    { href: '/admin/challenges', label: t('admin.challenges'), icon: 'trophy' },
    { href: '/admin/users', label: t('admin.users'), icon: 'people', adminOnly: true },
    { href: '/admin/license', label: `${t('admin.license')} · ${license.data?.license.company ?? ''}`, icon: 'card', adminOnly: true },
  ];

  return (
    <Screen header={<Header title={t('admin.title')} />}>
      <SectionTitle>{t('admin.kpis')}</SectionTitle>
      <View style={styles.kpis}>
        {kpis.map(([label, value, icon]) => (
          <View key={label} style={styles.kpi}>
            <Ionicons name={icon} size={18} color={colors.primary} />
            <Text style={styles.kpiValue}>{value}</Text>
            <Text style={styles.kpiLabel}>{label}</Text>
          </View>
        ))}
      </View>
      <View style={{ marginTop: spacing.xl, gap: spacing.sm }}>
        {links
          .filter((l) => !l.adminOnly || me.role === 'admin')
          .map((l) => (
            <Pressable key={l.label} style={styles.link} onPress={() => router.push(l.href)} accessibilityRole="button">
              <Ionicons name={l.icon} size={22} color={colors.primary} />
              <Text style={styles.linkText}>{l.label}</Text>
              <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
            </Pressable>
          ))}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  kpis: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  kpi: { width: '48%', flexGrow: 1, backgroundColor: colors.surfaceAlt, borderRadius: radius.lg, padding: spacing.lg, gap: 2 },
  kpiValue: { fontFamily: fonts.bold, fontSize: 32, color: colors.text },
  kpiLabel: { fontFamily: fonts.regular, fontSize: fontSize.xs, color: colors.textMuted },
  link: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.lg,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  linkText: { flex: 1, fontFamily: fonts.semibold, fontSize: fontSize.md, color: colors.text },
});
