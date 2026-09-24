import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { useCourses, useProgress } from '@/hooks/api';
import { useI18n } from '@/i18n';
import { progressPercent } from '@/modules/university/progress';
import { Card, EmptyState, Header, LinearProgress, Loading, Screen, SectionTitle } from '@/shared/components';
import { useUser } from '@/stores/session';
import { colors, fonts, fontSize, radius, spacing } from '@/theme';

export default function Certificates() {
  const { t, tr, formatDate } = useI18n();
  const user = useUser();
  const courses = useCourses();
  const progress = useProgress(user.id);
  if (!courses.data || !progress.data) return <Loading />;

  const rows = courses.data.map((c) => {
    const p = progress.data.find((x) => x.courseId === c.id);
    return { course: c, percent: progressPercent(c, p), date: p?.updatedAt };
  });
  const earned = rows.filter((r) => r.percent === 100);
  const inProgress = rows.filter((r) => r.percent > 0 && r.percent < 100);

  return (
    <Screen header={<Header title={t('certificates.title')} />}>
      <SectionTitle>{t('certificates.earned')}</SectionTitle>
      {earned.length === 0 && <EmptyState icon="ribbon-outline" text={t('certificates.none')} />}
      {earned.map(({ course, date }) => (
        <View key={course.id} style={styles.cert}>
          <Ionicons name="ribbon" size={40} color={colors.yellow} />
          <View style={{ flex: 1 }}>
            <Text style={styles.certTitle}>{tr(course.title)}</Text>
            <Text style={styles.certSub}>{t('certificates.issued')}</Text>
            {date && <Text style={styles.certSub}>{formatDate(date)}</Text>}
          </View>
        </View>
      ))}

      <SectionTitle>{t('certificates.inProgress')}</SectionTitle>
      <View style={{ gap: spacing.md }}>
        {inProgress.map(({ course, percent }) => (
          <Card key={course.id} onPress={() => router.push({ pathname: '/university/course/[id]', params: { id: course.id } })}>
            <Text style={styles.title}>{tr(course.title)}</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginTop: spacing.sm }}>
              <View style={{ flex: 1 }}>
                <LinearProgress percent={percent} />
              </View>
              <Text style={styles.pct}>{percent}%</Text>
            </View>
          </Card>
        ))}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  cert: {
    flexDirection: 'row',
    gap: spacing.md,
    alignItems: 'center',
    padding: spacing.lg,
    borderRadius: radius.lg,
    borderWidth: 2,
    borderColor: colors.yellow,
    backgroundColor: '#FFFBEA',
    marginBottom: spacing.md,
  },
  certTitle: { fontFamily: fonts.semibold, fontSize: fontSize.md, color: colors.navy },
  certSub: { fontFamily: fonts.regular, fontSize: fontSize.xs, color: colors.textMuted },
  title: { fontFamily: fonts.semibold, fontSize: fontSize.md, color: colors.text },
  pct: { fontFamily: fonts.semibold, color: colors.primary },
});
