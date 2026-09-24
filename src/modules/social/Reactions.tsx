import { Pressable, StyleSheet, Text, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import { useToggleReaction } from '@/hooks/api';
import { useI18n } from '@/i18n';
import { useUser } from '@/stores/session';
import { colors, fonts, radius } from '@/theme';
import type { Post, ReactionKind } from '@/types/domain';

export const REACTION_EMOJI: Record<ReactionKind, string> = { like: '👍', wow: '😲', idea: '💡' };
export const REACTION_KINDS: ReactionKind[] = ['like', 'wow', 'idea'];

/** 👍 like · 😲 wow · 💡 good idea (DIARIO, Red Social Corporativa). */
export function ReactionButtons({ post, dark, vertical }: { post: Post; dark?: boolean; vertical?: boolean }) {
  const user = useUser();
  const { t } = useI18n();
  const toggle = useToggleReaction();
  return (
    <View style={[styles.row, vertical && { flexDirection: 'column' }]}>
      {REACTION_KINDS.map((k) => {
        const mine = post.reactions[k].includes(user.id);
        return (
          <Pressable
            key={k}
            onPress={() => {
              Haptics.selectionAsync().catch(() => undefined);
              toggle.mutate({ postId: post.id, kind: k });
            }}
            accessibilityRole="button"
            accessibilityLabel={`${t(`social.reactions.${k}`)} ${post.reactions[k].length}`}
            accessibilityState={{ selected: mine }}
            style={[styles.btn, dark && styles.btnDark, mine && styles.btnOn]}
          >
            <Text style={styles.emoji}>{REACTION_EMOJI[k]}</Text>
            <Text style={[styles.count, dark && { color: colors.white }, mine && { color: colors.white }]}>{post.reactions[k].length}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 6 },
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.border,
  },
  btnDark: { backgroundColor: 'rgba(0,0,0,0.35)', borderColor: 'rgba(255,255,255,0.3)' },
  btnOn: { backgroundColor: colors.primary, borderColor: colors.primary },
  emoji: { fontSize: 14 },
  count: { fontFamily: fonts.semibold, fontSize: 12, color: colors.text },
});
