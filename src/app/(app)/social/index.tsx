import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState } from 'react';
import { FlatList, Pressable, Share, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { usePosts, useShare, useUsers } from '@/hooks/api';
import { useI18n } from '@/i18n';
import { ReactionButtons } from '@/modules/social/Reactions';
import { reactionCount } from '@/modules/social/scoring';
import { Avatar, HeaderIcon, Loading, MediaView, toast } from '@/shared/components';
import { useUser } from '@/stores/session';
import { colors, fonts, fontSize, radius, spacing } from '@/theme';
import type { Post } from '@/types/domain';

/** Vertical short-content feed (Figure 1, "Social Media View"). */
export default function SocialFeed() {
  const { t } = useI18n();
  const insets = useSafeAreaInsets();
  const user = useUser();
  const posts = usePosts();
  const [height, setHeight] = useState(0);

  return (
    <View style={{ flex: 1, backgroundColor: colors.white }}>
      <View style={[styles.top, { paddingTop: insets.top + spacing.sm }]}>
        <HeaderIcon icon="person" label={t('social.profile')} onPress={() => router.push({ pathname: '/social/profile/[id]', params: { id: user.id } })} />
        <HeaderIcon icon="trophy" label={t('social.challenges')} onPress={() => router.push('/social/challenges')} />
        <HeaderIcon icon="podium" label={t('social.ranking')} onPress={() => router.push('/social/ranking')} />
        <View style={{ flex: 1 }} />
        <HeaderIcon icon="home" label="Home" onPress={() => router.dismissTo('/home')} />
        <HeaderIcon icon="search" label={t('common.search')} onPress={() => router.push('/social/search')} />
      </View>
      <View style={{ flex: 1 }} onLayout={(e) => setHeight(e.nativeEvent.layout.height)}>
        {!posts.data || !height ? (
          <Loading />
        ) : (
          <FlatList
            data={posts.data}
            keyExtractor={(p) => p.id}
            pagingEnabled
            snapToInterval={height}
            decelerationRate="fast"
            showsVerticalScrollIndicator={false}
            getItemLayout={(_, index) => ({ length: height, offset: height * index, index })}
            renderItem={({ item, index }) => <FeedItem post={item} height={height} first={index === 0} />}
          />
        )}
      </View>
    </View>
  );
}

function FeedItem({ post, height, first }: { post: Post; height: number; first: boolean }) {
  const { t, tr, relative } = useI18n();
  const users = useUsers();
  const share = useShare();
  const [tray, setTray] = useState(true);
  const author = users.data?.find((u) => u.id === post.authorId);

  return (
    <View style={{ height, padding: spacing.md }}>
      <View style={styles.card}>
        <MediaView media={post.media} large style={StyleSheet.absoluteFill} />
        {first && (
          <View style={styles.swipe} pointerEvents="none">
            <Ionicons name="swap-vertical" size={90} color="rgba(255,255,255,0.85)" />
            <Text style={styles.swipeText}>{t('social.swipe')}</Text>
          </View>
        )}

        <View style={styles.info}>
          <Text style={styles.title}>{tr(post.title)}</Text>
          <Text style={styles.body} numberOfLines={3}>
            {tr(post.body)}
          </Text>
          <Text style={styles.meta}>
            {author?.name} · {author?.country} · {relative(post.createdAt)}
          </Text>
          <View style={styles.tags}>
            {post.tags.map((tag) => (
              <Text key={tag} style={styles.tag}>
                #{tag}
              </Text>
            ))}
          </View>
        </View>

        {tray && (
          <View style={styles.tray}>
            <ReactionButtons post={post} dark />
          </View>
        )}

        <View style={styles.actions}>
          <Pressable onPress={() => router.push({ pathname: '/social/profile/[id]', params: { id: post.authorId } })} accessibilityRole="button" accessibilityLabel={author?.name}>
            <Avatar user={author} size={46} ring />
          </Pressable>
          <ActionButton icon="heart" label={String(reactionCount(post))} onPress={() => setTray((v) => !v)} />
          <ActionButton icon="add" label={t('common.publish')} onPress={() => router.push('/create-post')} testID="feed-create" />
          <ActionButton icon="chatbubble-ellipses" label={String(post.comments.length)} onPress={() => router.push({ pathname: '/social/post/[id]', params: { id: post.id } })} />
          <ActionButton
            icon="arrow-redo"
            label={String(post.shares)}
            onPress={async () => {
              await Share.share({ message: `${tr(post.title)} — SENSE` }).catch(() => undefined);
              share.mutate(post.id);
              toast(t('social.shared'));
            }}
          />
        </View>
      </View>
    </View>
  );
}

function ActionButton({ icon, label, onPress, testID }: { icon: keyof typeof Ionicons.glyphMap; label: string; onPress: () => void; testID?: string }) {
  return (
    <Pressable onPress={onPress} style={styles.action} accessibilityRole="button" accessibilityLabel={`${icon} ${label}`} testID={testID}>
      <View style={styles.actionCircle}>
        <Ionicons name={icon} size={24} color={colors.white} />
      </View>
      <Text style={styles.actionLabel} numberOfLines={1}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  top: { backgroundColor: colors.primary, flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.md, paddingBottom: spacing.sm, gap: spacing.sm },
  card: { flex: 1, borderRadius: radius.xl, overflow: 'hidden', backgroundColor: colors.surface },
  swipe: { position: 'absolute', top: '22%', alignSelf: 'center', alignItems: 'center' },
  swipeText: { color: colors.white, fontFamily: fonts.medium, fontSize: fontSize.xs, marginTop: 4 },
  info: { position: 'absolute', left: spacing.lg, right: spacing.lg, bottom: 150, backgroundColor: 'rgba(6,32,91,0.55)', borderRadius: radius.lg, padding: spacing.md },
  title: { color: colors.white, fontFamily: fonts.bold, fontSize: fontSize.lg },
  body: { color: colors.white, fontFamily: fonts.regular, fontSize: fontSize.sm, marginTop: 2 },
  meta: { color: 'rgba(255,255,255,0.8)', fontFamily: fonts.regular, fontSize: 11, marginTop: 6 },
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 4 },
  tag: { color: '#BFE3F7', fontFamily: fonts.medium, fontSize: 11 },
  tray: { position: 'absolute', left: spacing.lg, bottom: 96 },
  actions: { position: 'absolute', bottom: spacing.md, left: spacing.sm, right: spacing.sm, flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-around' },
  action: { alignItems: 'center', width: 56 },
  actionCircle: { width: 46, height: 46, borderRadius: 23, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: colors.white },
  actionLabel: { color: colors.white, fontFamily: fonts.semibold, fontSize: 10, marginTop: 2, textShadowColor: 'rgba(0,0,0,0.6)', textShadowRadius: 3 },
});
