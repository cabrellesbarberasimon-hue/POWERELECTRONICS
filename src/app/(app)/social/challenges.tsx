import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useChallenges } from '@/hooks/api';
import { useI18n } from '@/i18n';
import { ChallengeCard } from '@/modules/social/ChallengeCard';
import { Chip, EmptyState, Header, Loading, Screen } from '@/shared/components';
import { spacing } from '@/theme';
import type { ChallengePeriod } from '@/types/domain';

/** Monthly, quarterly and annual challenges (DIARIO, Red Social Corporativa). */
export default function Challenges() {
  const { t } = useI18n();
  const challenges = useChallenges();
  const [period, setPeriod] = useState<ChallengePeriod | 'all'>('all');
  const list = (challenges.data ?? []).filter((c) => period === 'all' || c.period === period);

  return (
    <Screen header={<Header title={t('social.challenges')} />}>
      <View style={styles.filters}>
        <Chip label={t('university.filterAll')} active={period === 'all'} onPress={() => setPeriod('all')} />
        {(['monthly', 'quarterly', 'annual'] as const).map((p) => (
          <Chip key={p} label={t(`social.period.${p}`)} active={period === p} onPress={() => setPeriod(p)} />
        ))}
      </View>
      {!challenges.data ? <Loading /> : list.length === 0 ? <EmptyState text={t('common.empty')} icon="trophy-outline" /> : list.map((c) => <ChallengeCard key={c.id} challenge={c} />)}
    </Screen>
  );
}

const styles = StyleSheet.create({
  filters: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.lg },
});
