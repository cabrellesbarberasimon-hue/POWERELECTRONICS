import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { monthKey } from '@/data/time';
import { usePosts, useRatePost, useRatings, useUsers } from '@/hooks/api';
import { useI18n } from '@/i18n';
import { Avatar, Chip, EmptyState, Header, MediaView, Screen, Stars, toast } from '@/shared/components';
import { colors, fonts, fontSize, radius, spacing } from '@/theme';

/** Monthly private star evaluation of employee-generated training content. */
export default function Review() {
  const { t, tr, relative } = useI18n();
  const posts = usePosts();
  const users = useUsers();
  const ratings = useRatings({ month: monthKey() });
  const rate = useRatePost();
  const [tab, setTab] = useState<'pending' | 'rated'>('pending');

  const rated = new Map((ratings.data ?? []).map((r) => [r.postId, r]));
  const list = (posts.data ?? []).filter((p) => (tab === 'pending' ? !rated.has(p.id) : rated.has(p.id)));

  return (
    <Screen header={<Header title={t('admin.review')} />}>
      <Text style={styles.hint}>
        {monthKey()} · {t('social.starsPrivate')}
      </Text>
      <View style={styles.tabs}>
        <Chip label={`${t('admin.pendingReview')} (${(posts.data?.length ?? 0) - rated.size})`} active={tab === 'pending'} onPress={() => setTab('pending')} />
        <Chip label={`${t('admin.ratedThisMonth')} (${rated.size})`} active={tab === 'rated'} onPress={() => setTab('rated')} />
      </View>
      {list.length === 0 && <EmptyState text={t('common.empty')} icon="star-outline" />}
      {list.map((p) => {
        const author = users.data?.find((u) => u.id === p.authorId);
        return (
          <View key={p.id} style={styles.card}>
            <Pressable style={styles.row} onPress={() => router.push({ pathname: '/social/post/[id]', params: { id: p.id } })}>
              <MediaView media={p.media} style={styles.thumb} />
              <View style={{ flex: 1 }}>
                <Text style={styles.title} numberOfLines={1}>
                  {tr(p.title)}
                </Text>
                <Text style={styles.body} numberOfLines={2}>
                  {tr(p.body)}
                </Text>
                <View style={styles.author}>
                  <Avatar user={author} size={20} />
                  <Text style={styles.meta}>
                    {author?.name} · {relative(p.createdAt)}
                  </Text>
                </View>
              </View>
            </Pressable>
            <View style={styles.stars}>
              <Stars
                value={rated.get(p.id)?.stars ?? 0}
                size={28}
                onChange={(stars) => rate.mutate({ postId: p.id, stars }, { onSuccess: () => toast(`${'⭐'.repeat(stars)} · ${author?.name}`, 'success') })}
              />
            </View>
          </View>
        );
      })}
    </Screen>
  );
}

const styles = StyleSheet.create({
  hint: { fontFamily: fonts.regular, fontSize: fontSize.xs, color: colors.textMuted },
  tabs: { flexDirection: 'row', gap: spacing.sm, marginVertical: spacing.lg },
  card: { borderWidth: 1, borderColor: colors.border, borderRadius: radius.lg, padding: spacing.md, marginBottom: spacing.md, gap: spacing.sm },
  row: { flexDirection: 'row', gap: spacing.md },
  thumb: { width: 72, height: 72, minHeight: 72, borderRadius: radius.md },
  title: { fontFamily: fonts.semibold, fontSize: fontSize.sm, color: colors.text },
  body: { fontFamily: fonts.regular, fontSize: fontSize.xs, color: colors.textMuted },
  author: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 },
  meta: { fontFamily: fonts.regular, fontSize: 11, color: colors.textMuted },
  stars: { alignItems: 'center' },
});
