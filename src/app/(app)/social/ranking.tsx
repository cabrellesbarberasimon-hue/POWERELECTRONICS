import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useRanking, useUsers } from '@/hooks/api';
import { useI18n } from '@/i18n';
import { Avatar, Header, Loading, Screen, Stars } from '@/shared/components';
import { useUser } from '@/stores/session';
import { colors, fonts, fontSize, radius, spacing } from '@/theme';

const MEDAL = ['🥇', '🥈', '🥉'];

/** Contribution ranking: identifies internal talent. */
export default function Ranking() {
  const { t } = useI18n();
  const me = useUser();
  const ranking = useRanking();
  const users = useUsers();
  const privileged = me.role === 'instructor' || me.role === 'admin';

  if (!ranking.data || !users.data) return <Loading />;
  const top = ranking.data.slice(0, 3);

  return (
    <Screen header={<Header title={t('social.ranking')} />}>
      <View style={styles.podium}>
        {[top[1], top[0], top[2]].filter(Boolean).map((r) => {
          const u = users.data.find((x) => x.id === r.userId);
          const first = r.position === 1;
          return (
            <Pressable key={r.userId} style={[styles.podiumItem, first && { marginBottom: spacing.xl }]} onPress={() => router.push({ pathname: '/social/profile/[id]', params: { id: r.userId } })}>
              <Text style={{ fontSize: first ? 34 : 26 }}>{MEDAL[r.position - 1]}</Text>
              <Avatar user={u} size={first ? 72 : 56} />
              <Text style={styles.podiumName} numberOfLines={1}>
                {u?.name.split(' ')[0]}
              </Text>
              <Text style={styles.points}>{t('common.points', { count: r.points })}</Text>
            </Pressable>
          );
        })}
      </View>

      {ranking.data.map((r) => {
        const u = users.data.find((x) => x.id === r.userId);
        const mine = r.userId === me.id;
        return (
          <Pressable key={r.userId} style={[styles.row, mine && styles.rowMine]} onPress={() => router.push({ pathname: '/social/profile/[id]', params: { id: r.userId } })}>
            <Text style={styles.pos}>{r.position}</Text>
            <Avatar user={u} size={36} />
            <View style={{ flex: 1 }}>
              <Text style={styles.name}>
                {u?.name} {mine && `(${t('common.you')})`}
              </Text>
              <Text style={styles.meta}>
                {u?.country} · {r.posts} {t('social.postsLabel').toLowerCase()} · {r.challengesCompleted} {t('social.challengesLabel').toLowerCase()}
              </Text>
              {(privileged || mine) && r.ratingsCount > 0 && <Stars value={r.starsAverage} size={12} />}
            </View>
            <Text style={styles.points}>{r.points}</Text>
          </Pressable>
        );
      })}
    </Screen>
  );
}

const styles = StyleSheet.create({
  podium: { flexDirection: 'row', justifyContent: 'center', alignItems: 'flex-end', gap: spacing.lg, marginBottom: spacing.xl, backgroundColor: colors.primarySoft, borderRadius: radius.xl, padding: spacing.lg },
  podiumItem: { alignItems: 'center', width: 96, gap: 4 },
  podiumName: { fontFamily: fonts.semibold, fontSize: fontSize.sm, color: colors.text },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: spacing.sm, paddingHorizontal: spacing.sm, borderRadius: radius.md },
  rowMine: { backgroundColor: '#FFF4EC', borderWidth: 1, borderColor: colors.orange },
  pos: { width: 24, textAlign: 'center', fontFamily: fonts.bold, color: colors.textMuted },
  name: { fontFamily: fonts.semibold, fontSize: fontSize.sm, color: colors.text },
  meta: { fontFamily: fonts.regular, fontSize: 11, color: colors.textMuted },
  points: { fontFamily: fonts.bold, fontSize: fontSize.md, color: colors.primary },
});
