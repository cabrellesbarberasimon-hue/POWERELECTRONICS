import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useUsers } from '@/hooks/api';
import { useI18n } from '@/i18n';
import { AudioWave, MediaView } from '@/shared/components';
import { colors, fonts, fontSize, radius, shadow, spacing } from '@/theme';
import type { Post } from '@/types/domain';
import { ReactionButtons } from './Reactions';

/** Community card (Figure 2, "Community"): author icon, blue caps title, reactions, body, audio. */
export function CommunityPost({ post, featured }: { post: Post; featured?: boolean }) {
  const { tr, relative } = useI18n();
  const users = useUsers();
  const author = users.data?.find((u) => u.id === post.authorId);
  return (
    <Pressable
      onPress={() => router.push({ pathname: '/social/post/[id]', params: { id: post.id } })}
      style={[styles.card, featured ? styles.featured : styles.reply]}
      accessibilityRole="button"
      accessibilityLabel={tr(post.title)}
    >
      <View style={styles.head}>
        <Ionicons name="person-circle" size={featured ? 22 : 18} color={featured ? colors.primary : colors.darkTab} />
        <Text style={[styles.title, !featured && { color: colors.darkTab }]} numberOfLines={1}>
          {tr(post.title)}
        </Text>
        <View style={styles.icons}>
          <Ionicons name="thumbs-up" size={14} color={colors.darkTab} />
          <Ionicons name="chatbubble-ellipses" size={14} color={colors.darkTab} />
          <Text style={styles.count}>{post.comments.length}</Text>
        </View>
      </View>
      <Text style={styles.author}>
        {author?.name ?? ''} · {author?.country ?? ''} · {relative(post.createdAt)}
      </Text>
      <Text style={styles.body} numberOfLines={featured ? 4 : 2}>
        {tr(post.body)}
      </Text>
      {post.media.kind === 'audio' ? (
        <View style={{ marginTop: spacing.sm }}>
          <AudioWave durationSec={post.media.durationSec} />
        </View>
      ) : featured && post.media.kind !== 'text' ? (
        <MediaView media={post.media} style={{ marginTop: spacing.sm, minHeight: 120 }} />
      ) : null}
      <View style={{ marginTop: spacing.sm }}>
        <ReactionButtons post={post} />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: colors.white, borderRadius: radius.lg, padding: spacing.md, ...shadow.card },
  featured: {},
  reply: { marginLeft: spacing.xl },
  head: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  title: { flex: 1, fontFamily: fonts.bold, fontSize: fontSize.md, color: colors.primary },
  icons: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  count: { fontFamily: fonts.medium, fontSize: 11, color: colors.textMuted },
  author: { fontFamily: fonts.regular, fontSize: 10, color: colors.textMuted, marginTop: 2 },
  body: { fontFamily: fonts.regular, fontSize: fontSize.sm, color: colors.text, marginTop: 4, lineHeight: 18 },
});
