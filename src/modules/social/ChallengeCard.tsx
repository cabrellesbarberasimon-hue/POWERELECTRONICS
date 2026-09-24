import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { useChallengeProgress, useJoinChallenge } from '@/hooks/api';
import { useI18n } from '@/i18n';
import { Card, LinearProgress, OutlineButton, PrimaryButton } from '@/shared/components';
import { useUser } from '@/stores/session';
import { colors, fonts, fontSize, radius, spacing } from '@/theme';
import type { Challenge } from '@/types/domain';

export function ChallengeCard({ challenge }: { challenge: Challenge }) {
  const { t, tr, formatDate } = useI18n();
  const user = useUser();
  const join = useJoinChallenge();
  const progress = useChallengeProgress(challenge.id, user.id);
  const joined = challenge.participants.includes(user.id);
  const done = challenge.completedBy.includes(user.id);

  const act = () => {
    switch (challenge.goal.type) {
      case 'publish':
        return router.push({ pathname: '/create-post', params: { challengeId: challenge.id } });
      case 'training':
        return router.push('/training');
      case 'complete_steps':
        return router.push('/university');
      default:
        return router.push('/social');
    }
  };

  return (
    <Card style={styles.card}>
      <View style={styles.head}>
        <View style={[styles.period, { backgroundColor: challenge.period === 'annual' ? colors.navy : challenge.period === 'quarterly' ? colors.orange : colors.primary }]}>
          <Text style={styles.periodText}>{t(`social.period.${challenge.period}`)}</Text>
        </View>
        {challenge.createdBy === 'ai' && (
          <View style={styles.ai}>
            <Ionicons name="sparkles" size={12} color={colors.primary} />
            <Text style={styles.aiText}>{t('social.byAI')}</Text>
          </View>
        )}
        <View style={{ flex: 1 }} />
        <Text style={styles.points}>+{challenge.points}</Text>
      </View>
      <Text style={styles.title}>{tr(challenge.title)}</Text>
      <Text style={styles.desc}>{tr(challenge.description)}</Text>
      {progress.data && (
        <View style={styles.progress}>
          <View style={{ flex: 1 }}>
            <LinearProgress percent={progress.data.percent} color={done ? colors.green : colors.primary} />
          </View>
          <Text style={styles.count}>
            {progress.data.current}/{progress.data.target}
          </Text>
        </View>
      )}
      <Text style={styles.meta}>
        {t('social.endsIn', { date: formatDate(challenge.endsAt) })} · {t('social.participants', { count: challenge.participants.length })}
      </Text>
      <View style={{ flexDirection: 'row', gap: spacing.sm, marginTop: spacing.md }}>
        {done ? (
          <View style={styles.done}>
            <Ionicons name="checkmark-circle" size={18} color={colors.green} />
            <Text style={[styles.count, { color: colors.green }]}>{t('social.completedChallenge')}</Text>
          </View>
        ) : joined ? (
          <OutlineButton compact label={t('common.continue')} iconRight="chevron-forward" onPress={act} style={{ flex: 1 }} />
        ) : (
          <PrimaryButton compact label={t('social.join')} icon="flag" onPress={() => join.mutate(challenge.id)} loading={join.isPending} style={{ flex: 1 }} />
        )}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  filters: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.lg },
  card: { marginBottom: spacing.md },
  head: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  period: { borderRadius: radius.sm, paddingHorizontal: 8, paddingVertical: 2 },
  periodText: { color: colors.white, fontFamily: fonts.semibold, fontSize: 10 },
  ai: { flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: colors.primarySoft, borderRadius: radius.sm, paddingHorizontal: 6, paddingVertical: 2 },
  aiText: { color: colors.primary, fontFamily: fonts.medium, fontSize: 10 },
  points: { fontFamily: fonts.bold, color: colors.orange, fontSize: fontSize.md },
  title: { fontFamily: fonts.semibold, fontSize: fontSize.lg, color: colors.text, marginTop: spacing.sm },
  desc: { fontFamily: fonts.regular, fontSize: fontSize.sm, color: colors.textMuted, marginTop: 2 },
  progress: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginTop: spacing.md },
  count: { fontFamily: fonts.semibold, fontSize: fontSize.sm, color: colors.primary },
  meta: { fontFamily: fonts.regular, fontSize: fontSize.xs, color: colors.textMuted, marginTop: spacing.sm },
  done: { flexDirection: 'row', alignItems: 'center', gap: 6 },
});
