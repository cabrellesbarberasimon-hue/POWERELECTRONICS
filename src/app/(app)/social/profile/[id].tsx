import { router, useLocalSearchParams } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useContribution, usePosts, useRanking, useRatings, useUsers } from '@/hooks/api';
import { useI18n } from '@/i18n';
import { REACTION_EMOJI, REACTION_KINDS } from '@/modules/social/Reactions';
import { Avatar, Card, EmptyState, Header, Loading, MediaView, Screen, SectionTitle, Stars } from '@/shared/components';
import { useUser } from '@/stores/session';
import { colors, fonts, fontSize, radius, spacing } from '@/theme';

/** Employee profile with contribution accounting (points, content, stars, challenges, ranking). */
export default function Profile() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t, tr } = useI18n();
  const me = useUser();
  const users = useUsers();
  const contribution = useContribution(id);
  const ranking = useRanking();
  const posts = usePosts({ authorId: id });
  const ratings = useRatings({ authorId: id });

  const user = users.data?.find((u) => u.id === id);
  if (!user || !contribution.data) return <Loading />;
  const c = contribution.data;
  const position = ranking.data?.find((r) => r.userId === id)?.position;
  const canSeeStars = me.id === id || me.role === 'instructor' || me.role === 'admin';
  const reactions = REACTION_KINDS.reduce((a, k) => a + c.reactionsReceived[k], 0);

  const stats: [string, string | number][] = [
    [t('social.pointsLabel'), c.points],
    [t('social.position'), position ? `#${position}` : '—'],
    [t('social.postsLabel'), c.posts],
    [t('social.reactionsLabel'), reactions],
    [t('social.challengesLabel'), c.challengesCompleted],
    [t('social.lessonsLabel'), c.stepsCompleted],
    [t('social.trainingsLabel'), c.trainingsCompleted],
  ];

  return (
    <Screen header={<Header title={t('social.profile')} />}>
      <View style={styles.head}>
        <Avatar user={user} size={88} />
        <Text style={styles.name}>{user.name}</Text>
        <Text style={styles.meta}>
          {t(`roles.${user.role}`)} · {user.department} · {user.country}
        </Text>
        {position && position <= 3 && <Text style={styles.talent}>⭐ {t('social.talent')}</Text>}
      </View>

      <View style={styles.grid}>
        {stats.map(([k, v]) => (
          <View key={k} style={styles.stat}>
            <Text style={styles.statValue}>{v}</Text>
            <Text style={styles.statLabel}>{k}</Text>
          </View>
        ))}
      </View>

      <View style={styles.reactions}>
        {REACTION_KINDS.map((k) => (
          <Text key={k} style={styles.reaction}>
            {REACTION_EMOJI[k]} {c.reactionsReceived[k]}
          </Text>
        ))}
      </View>

      {canSeeStars && (
        <Card style={styles.stars}>
          <Text style={styles.starsTitle}>
            {t('social.stars')} · {t('social.avgStars')} {c.starsAverage || '—'}
          </Text>
          <Text style={styles.meta}>{t('social.starsPrivate')}</Text>
          <Stars value={c.starsAverage} size={26} />
          {ratings.data?.map((r) => (
            <Text key={r.id} style={styles.meta}>
              {r.month} · {'⭐'.repeat(r.stars)} {r.note ? `· ${r.note}` : ''}
            </Text>
          ))}
        </Card>
      )}

      <SectionTitle>{t('social.myPosts')}</SectionTitle>
      {posts.data?.length === 0 && <EmptyState text={t('common.empty')} />}
      <View style={styles.posts}>
        {posts.data?.map((p) => (
          <Pressable key={p.id} style={styles.post} onPress={() => router.push({ pathname: '/social/post/[id]', params: { id: p.id } })}>
            <MediaView media={p.media} style={{ minHeight: 110, height: 110 }} />
            <Text style={styles.postTitle} numberOfLines={2}>
              {tr(p.title)}
            </Text>
          </Pressable>
        ))}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  head: { alignItems: 'center', gap: 4 },
  name: { fontFamily: fonts.semibold, fontSize: fontSize.xl, color: colors.text, marginTop: spacing.sm },
  meta: { fontFamily: fonts.regular, fontSize: fontSize.xs, color: colors.textMuted },
  talent: { fontFamily: fonts.semibold, color: colors.orange, marginTop: 4 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', marginTop: spacing.lg, gap: spacing.sm },
  stat: { width: '31%', flexGrow: 1, backgroundColor: colors.surfaceAlt, borderRadius: radius.md, padding: spacing.md, alignItems: 'center' },
  statValue: { fontFamily: fonts.bold, fontSize: fontSize.xl, color: colors.primary },
  statLabel: { fontFamily: fonts.regular, fontSize: 11, color: colors.textMuted, textAlign: 'center' },
  reactions: { flexDirection: 'row', justifyContent: 'center', gap: spacing.xl, marginTop: spacing.lg },
  reaction: { fontFamily: fonts.semibold, fontSize: fontSize.lg, color: colors.text },
  stars: { marginTop: spacing.lg, gap: 4, backgroundColor: '#FFFBEB', borderWidth: 1, borderColor: '#FDE68A' },
  starsTitle: { fontFamily: fonts.semibold, color: colors.text },
  posts: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  post: { width: '48%', gap: 4 },
  postTitle: { fontFamily: fonts.medium, fontSize: fontSize.xs, color: colors.text },
});
