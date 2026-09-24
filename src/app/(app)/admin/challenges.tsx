import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import { useChallengeSuggestions, useChallenges, useCreateChallenge } from '@/hooks/api';
import { useI18n } from '@/i18n';
import type { ChallengeDraft } from '@/modules/ai';
import { Card, Chip, Header, Loading, PrimaryButton, Screen, SectionTitle, toast } from '@/shared/components';
import { colors, fonts, fontSize, radius, spacing } from '@/theme';
import type { ChallengeGoal, ChallengePeriod } from '@/types/domain';

/** Challenge management: SENSE AI suggestions + manual creation. */
export default function AdminChallenges() {
  const { t, tr } = useI18n();
  const suggestions = useChallengeSuggestions();
  const challenges = useChallenges();
  const create = useCreateChallenge();
  const [title, setTitle] = useState('');
  const [desc, setDesc] = useState('');
  const [period, setPeriod] = useState<ChallengePeriod>('monthly');
  const [goal, setGoal] = useState<ChallengeGoal['type']>('publish');
  const [target, setTarget] = useState('2');
  const [points, setPoints] = useState('50');

  const add = (draft: ChallengeDraft, createdBy: 'admin' | 'ai') =>
    create.mutate({ draft, createdBy }, { onSuccess: () => toast(t('admin.created'), 'success') });

  return (
    <Screen header={<Header title={t('admin.challenges')} />}>
      <SectionTitle>
        <Ionicons name="sparkles" size={16} color={colors.primary} /> {t('admin.aiSuggestions')}
      </SectionTitle>
      {!suggestions.data ? (
        <Loading />
      ) : suggestions.data.length === 0 ? (
        <Text style={styles.muted}>{t('common.empty')}</Text>
      ) : (
        suggestions.data.map((d, i) => (
          <Card key={i} style={styles.card}>
            <Text style={styles.period}>
              {t(`social.period.${d.period}`)} · +{d.points}
            </Text>
            <Text style={styles.title}>{tr(d.title)}</Text>
            <Text style={styles.muted}>{tr(d.description)}</Text>
            <PrimaryButton compact icon="add" label={t('admin.create')} onPress={() => add(d, 'ai')} style={{ marginTop: spacing.sm }} />
          </Card>
        ))
      )}

      <SectionTitle>{t('admin.newChallenge')}</SectionTitle>
      <TextInput value={title} onChangeText={setTitle} placeholder={t('admin.challengeTitle')} style={styles.input} />
      <TextInput value={desc} onChangeText={setDesc} placeholder={t('admin.challengeDescription')} style={styles.input} multiline />
      <View style={styles.chips}>
        {(['monthly', 'quarterly', 'annual'] as const).map((p) => (
          <Chip key={p} label={t(`social.period.${p}`)} active={period === p} onPress={() => setPeriod(p)} />
        ))}
      </View>
      <Text style={styles.label}>{t('admin.goal')}</Text>
      <View style={styles.chips}>
        {(['publish', 'complete_steps', 'training', 'reactions'] as const).map((g) => (
          <Chip key={g} label={t(`admin.goals.${g}`)} active={goal === g} onPress={() => setGoal(g)} />
        ))}
      </View>
      <View style={{ flexDirection: 'row', gap: spacing.md }}>
        <View style={{ flex: 1 }}>
          <Text style={styles.label}>{t('admin.target')}</Text>
          <TextInput value={target} onChangeText={setTarget} keyboardType="number-pad" style={styles.input} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.label}>{t('social.pointsLabel')}</Text>
          <TextInput value={points} onChangeText={setPoints} keyboardType="number-pad" style={styles.input} />
        </View>
      </View>
      <PrimaryButton
        label={t('admin.create')}
        icon="trophy"
        disabled={!title.trim()}
        loading={create.isPending}
        onPress={() =>
          add(
            {
              title: { en: title, es: title },
              description: { en: desc, es: desc },
              period,
              points: Number(points) || 0,
              goal: { type: goal, target: Math.max(1, Number(target) || 1) } as ChallengeGoal,
            },
            'admin',
          )
        }
      />

      <SectionTitle>{t('social.challenges')}</SectionTitle>
      {challenges.data?.map((c) => (
        <View key={c.id} style={styles.row}>
          <Text style={styles.rowTitle}>{tr(c.title)}</Text>
          <Text style={styles.muted}>
            {t(`social.period.${c.period}`)} · {c.participants.length}/{c.completedBy.length} {c.createdBy === 'ai' ? '· AI' : ''}
          </Text>
        </View>
      ))}
    </Screen>
  );
}

const styles = StyleSheet.create({
  card: { marginBottom: spacing.md, gap: 2 },
  period: { fontFamily: fonts.semibold, fontSize: 11, color: colors.orange },
  title: { fontFamily: fonts.semibold, fontSize: fontSize.md, color: colors.text },
  muted: { fontFamily: fonts.regular, fontSize: fontSize.xs, color: colors.textMuted },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontFamily: fonts.regular,
    marginBottom: spacing.sm,
    minHeight: 44,
  },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.sm },
  label: { fontFamily: fonts.semibold, fontSize: fontSize.sm, color: colors.text, marginVertical: 4 },
  row: { paddingVertical: spacing.sm, borderBottomWidth: 1, borderColor: '#F0F0F0' },
  rowTitle: { fontFamily: fonts.medium, fontSize: fontSize.sm, color: colors.text },
});
