import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { useI18n } from '@/i18n';
import { Card, ProgressRing } from '@/shared/components';
import { colors, fonts, fontSize, radius, spacing } from '@/theme';
import type { Course } from '@/types/domain';
import { stepCount } from './progress';

export function CourseRow({ course, percent }: { course: Course; percent: number }) {
  const { t, tr } = useI18n();
  return (
    <Card onPress={() => router.push({ pathname: '/university/course/[id]', params: { id: course.id } })} style={styles.card}>
      <View style={{ flex: 1, gap: 2 }}>
        <View style={styles.meta}>
          <Text style={styles.path}>{course.path.join('/')}</Text>
          {course.source === 'moodle' && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{t('university.moodle')}</Text>
            </View>
          )}
        </View>
        <Text style={styles.title}>{tr(course.title)}</Text>
        <Text style={styles.desc} numberOfLines={2}>
          {tr(course.description)}
        </Text>
        <View style={styles.meta}>
          <Ionicons name="layers-outline" size={13} color={colors.textMuted} />
          <Text style={styles.small}>{t('university.stepsCount', { count: stepCount(course) })}</Text>
          <Text style={styles.small}>· {t(`university.area.${course.area}`)}</Text>
          {course.equipmentId && <Ionicons name="scan" size={13} color={colors.orange} />}
        </View>
      </View>
      <ProgressRing percent={percent} size={52} />
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  meta: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  path: { fontFamily: fonts.semibold, fontSize: 10, color: colors.primary, letterSpacing: 0.5 },
  title: { fontFamily: fonts.semibold, fontSize: fontSize.md, color: colors.text },
  desc: { fontFamily: fonts.regular, fontSize: fontSize.xs, color: colors.textMuted, lineHeight: 16 },
  small: { fontFamily: fonts.regular, fontSize: fontSize.xs, color: colors.textMuted },
  badge: { backgroundColor: colors.orange, borderRadius: radius.sm, paddingHorizontal: 6 },
  badgeText: { color: colors.white, fontFamily: fonts.semibold, fontSize: 9 },
});
