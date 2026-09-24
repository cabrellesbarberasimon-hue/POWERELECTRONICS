import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useCourses, usePosts, useEquipmentList, useRecommendations } from '@/hooks/api';
import { useI18n } from '@/i18n';
import { findStep } from '@/modules/university/progress';
import { useUser } from '@/stores/session';
import { colors, fonts, fontSize, radius, shadow, spacing } from '@/theme';
import type { Recommendation } from './types';

const ICON: Record<Recommendation['kind'], keyof typeof Ionicons.glyphMap> = {
  step: 'book',
  post: 'people',
  training: 'scan',
};

/** Horizontal carousel of AI recommendations with their explanations. */
export function RecommendationList() {
  const user = useUser();
  const { tr } = useI18n();
  const recs = useRecommendations(user.id);
  const courses = useCourses();
  const posts = usePosts();
  const equipment = useEquipmentList();

  if (!recs.data?.length) return null;

  const describe = (r: Recommendation) => {
    if (r.kind === 'step') {
      const course = courses.data?.find((c) => c.id === r.courseId);
      const found = course && findStep(course, r.stepId);
      return {
        title: found ? tr(found.step.title) : '',
        subtitle: course ? tr(course.title) : '',
        go: () => router.push({ pathname: '/university/lesson/[courseId]/[stepId]', params: { courseId: r.courseId, stepId: r.stepId } }),
      };
    }
    if (r.kind === 'post') {
      const post = posts.data?.find((p) => p.id === r.postId);
      return { title: post ? tr(post.title) : '', subtitle: post ? tr(post.body) : '', go: () => router.push({ pathname: '/social/post/[id]', params: { id: r.postId } }) };
    }
    const eq = equipment.data?.find((e) => e.id === r.equipmentId);
    const part = eq?.parts.find((p) => p.id === r.partId);
    return {
      title: part ? `${tr(part.name)} · AR` : '',
      subtitle: eq?.name ?? '',
      go: () => router.push({ pathname: '/training/[equipmentId]', params: { equipmentId: r.equipmentId, part: r.partId } }),
    };
  };

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
      {recs.data.map((r) => {
        const d = describe(r);
        if (!d.title) return null;
        return (
          <Pressable key={r.id} onPress={d.go} style={styles.card} accessibilityRole="button" accessibilityLabel={d.title}>
            <View style={styles.top}>
              <View style={[styles.icon, r.kind === 'training' && { backgroundColor: colors.orange }]}>
                <Ionicons name={ICON[r.kind]} size={16} color={colors.white} />
              </View>
              <Text style={styles.score}>AI {r.score.toFixed(1)}</Text>
            </View>
            <Text style={styles.title} numberOfLines={2}>
              {d.title}
            </Text>
            <Text style={styles.subtitle} numberOfLines={1}>
              {d.subtitle}
            </Text>
            <View style={styles.reason}>
              <Ionicons name="sparkles" size={12} color={colors.primary} />
              <Text style={styles.reasonText} numberOfLines={2}>
                {tr(r.reasons[0])}
              </Text>
            </View>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: { gap: spacing.md, paddingVertical: spacing.sm, paddingRight: spacing.lg },
  card: { width: 210, backgroundColor: colors.white, borderRadius: radius.lg, padding: spacing.md, gap: 4, borderWidth: 1, borderColor: '#EEF0F3', ...shadow.card },
  top: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  icon: { width: 28, height: 28, borderRadius: 14, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  score: { fontFamily: fonts.medium, fontSize: 10, color: colors.textMuted },
  title: { fontFamily: fonts.semibold, fontSize: fontSize.sm, color: colors.text, marginTop: 4 },
  subtitle: { fontFamily: fonts.regular, fontSize: fontSize.xs, color: colors.textMuted },
  reason: { flexDirection: 'row', gap: 4, alignItems: 'flex-start', backgroundColor: colors.primarySoft, borderRadius: radius.sm, padding: 6, marginTop: 4 },
  reasonText: { flex: 1, fontFamily: fonts.regular, fontSize: 10, color: colors.navy },
});
