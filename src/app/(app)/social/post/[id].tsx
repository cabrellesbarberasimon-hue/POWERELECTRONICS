import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useAddComment, usePost, useRatePost, useRatings, useUsers } from '@/hooks/api';
import { useI18n } from '@/i18n';
import { ReactionButtons } from '@/modules/social/Reactions';
import { Avatar, Card, EmptyState, Header, HeaderIcon, Loading, MediaView, Screen, SectionTitle, Stars, toast } from '@/shared/components';
import { useUser } from '@/stores/session';
import { colors, fonts, fontSize, radius, spacing } from '@/theme';
import { monthKey } from '@/data/time';

/** Post detail with comments and private star rating for evaluators. */
export default function PostDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t, tr, relative } = useI18n();
  const user = useUser();
  const post = usePost(id);
  const users = useUsers();
  const addComment = useAddComment();
  const rate = useRatePost();
  const ratings = useRatings({ month: monthKey() });
  const [text, setText] = useState('');

  if (!post.data) return <Loading />;
  const p = post.data;
  const author = users.data?.find((u) => u.id === p.authorId);
  const isEvaluator = user.role === 'instructor' || user.role === 'admin';
  const myRating = ratings.data?.find((r) => r.postId === p.id);
  const canSeeRating = isEvaluator || p.authorId === user.id;

  const send = () => {
    if (!text.trim()) return;
    addComment.mutate({ postId: p.id, text: text.trim() }, { onSuccess: () => setText('') });
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <Screen
        header={
          <Header
            title={tr(p.title)}
            home={false}
            right={<HeaderIcon icon="close" label={t('common.close')} onPress={() => router.back()} />}
            back={false}
          />
        }
        footer={
          <View style={styles.composer}>
            <TextInput
              value={text}
              onChangeText={setText}
              placeholder={t('social.writeComment')}
              style={styles.input}
              onSubmitEditing={send}
              testID="comment-input"
            />
            <Pressable onPress={send} style={styles.send} accessibilityRole="button" accessibilityLabel={t('common.send')}>
              <Text style={styles.sendText}>{t('common.send')}</Text>
            </Pressable>
          </View>
        }
      >
        <Pressable style={styles.author} onPress={() => router.push({ pathname: '/social/profile/[id]', params: { id: p.authorId } })}>
          <Avatar user={author} size={40} />
          <View style={{ flex: 1 }}>
            <Text style={styles.authorName}>{author?.name}</Text>
            <Text style={styles.meta}>
              {author?.country} · {relative(p.createdAt)}
            </Text>
          </View>
        </Pressable>
        <MediaView media={p.media} style={{ height: 220, marginTop: spacing.md }} />
        <Text style={styles.body}>{tr(p.body)}</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: spacing.md }}>
          {p.tags.map((tag) => (
            <Text key={tag} style={styles.tag}>
              #{tag}
            </Text>
          ))}
        </View>
        <ReactionButtons post={p} />

        {canSeeRating && (
          <Card style={styles.rating}>
            <Text style={styles.ratingTitle}>⭐ {t('social.stars')}</Text>
            <Text style={styles.meta}>{t('social.starsPrivate')}</Text>
            <View style={{ marginTop: spacing.sm }}>
              {isEvaluator ? (
                <Stars
                  value={myRating?.stars ?? 0}
                  size={30}
                  onChange={(stars) =>
                    rate.mutate({ postId: p.id, stars }, { onSuccess: () => toast(`${t('social.rate')}: ${stars} ⭐`, 'success') })
                  }
                />
              ) : (
                <Stars value={myRating?.stars ?? 0} size={24} />
              )}
            </View>
          </Card>
        )}

        <SectionTitle>
          {t('social.comments')} ({p.comments.length})
        </SectionTitle>
        {p.comments.length === 0 && <EmptyState text={t('social.noComments')} icon="chatbubbles-outline" />}
        {p.comments.map((c) => {
          const cu = users.data?.find((u) => u.id === c.authorId);
          return (
            <View key={c.id} style={styles.comment}>
              <Avatar user={cu} size={32} />
              <View style={styles.bubble}>
                <Text style={styles.commentAuthor}>
                  {cu?.name} <Text style={styles.meta}>· {relative(c.createdAt)}</Text>
                </Text>
                <Text style={styles.commentText}>{tr(c.text)}</Text>
              </View>
            </View>
          );
        })}
      </Screen>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  author: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  authorName: { fontFamily: fonts.semibold, fontSize: fontSize.md, color: colors.text },
  meta: { fontFamily: fonts.regular, fontSize: fontSize.xs, color: colors.textMuted },
  body: { fontFamily: fonts.regular, fontSize: fontSize.md, color: colors.text, lineHeight: 22, marginVertical: spacing.md },
  tag: { fontFamily: fonts.medium, fontSize: fontSize.xs, color: colors.primary },
  rating: { marginTop: spacing.lg, borderWidth: 1, borderColor: '#FDE68A', backgroundColor: '#FFFBEB' },
  ratingTitle: { fontFamily: fonts.semibold, fontSize: fontSize.md, color: colors.text },
  comment: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.md },
  bubble: { flex: 1, backgroundColor: colors.surfaceAlt, borderRadius: radius.md, padding: spacing.md },
  commentAuthor: { fontFamily: fonts.semibold, fontSize: fontSize.sm, color: colors.text },
  commentText: { fontFamily: fonts.regular, fontSize: fontSize.sm, color: colors.text, marginTop: 2 },
  composer: {
    flexDirection: 'row',
    gap: spacing.sm,
    padding: spacing.md,
    borderTopWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.white,
  },
  input: {
    flex: 1,
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.lg,
    height: 42,
    fontFamily: fonts.regular,
  },
  send: { backgroundColor: colors.primary, borderRadius: radius.pill, paddingHorizontal: spacing.lg, justifyContent: 'center' },
  sendText: { color: colors.white, fontFamily: fonts.semibold },
});
