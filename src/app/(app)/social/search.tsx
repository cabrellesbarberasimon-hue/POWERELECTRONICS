import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { usePosts, useUsers } from '@/hooks/api';
import { useI18n } from '@/i18n';
import { Avatar, EmptyState, Header, Screen, SectionTitle } from '@/shared/components';
import { colors, fonts, fontSize, radius, spacing } from '@/theme';

export default function SocialSearch() {
  const { t, tr } = useI18n();
  const [q, setQ] = useState('');
  const posts = usePosts(q.trim() ? { query: q } : undefined);
  const users = useUsers();
  const people = q.trim()
    ? (users.data ?? []).filter((u) => `${u.name} ${u.country} ${u.department}`.toLowerCase().includes(q.trim().toLowerCase()))
    : [];

  return (
    <Screen header={<Header title={t('common.search')} />}>
      <TextInput autoFocus value={q} onChangeText={setQ} placeholder={t('social.searchPlaceholder')} style={styles.input} />
      {!q.trim() ? (
        <EmptyState icon="search" text={t('social.searchPlaceholder')} />
      ) : (
        <>
          <SectionTitle>{t('social.people')}</SectionTitle>
          {people.map((u) => (
            <Pressable
              key={u.id}
              style={styles.row}
              onPress={() => router.push({ pathname: '/social/profile/[id]', params: { id: u.id } })}
            >
              <Avatar user={u} size={36} />
              <View>
                <Text style={styles.name}>{u.name}</Text>
                <Text style={styles.meta}>
                  {t(`roles.${u.role}`)} · {u.country}
                </Text>
              </View>
            </Pressable>
          ))}
          <SectionTitle>{t('social.posts')}</SectionTitle>
          {posts.data?.map((p) => (
            <Pressable key={p.id} style={styles.row} onPress={() => router.push({ pathname: '/social/post/[id]', params: { id: p.id } })}>
              <View style={[styles.thumb, { backgroundColor: p.media.tint }]} />
              <View style={{ flex: 1 }}>
                <Text style={styles.name}>{tr(p.title)}</Text>
                <Text style={styles.meta} numberOfLines={1}>
                  {tr(p.body)}
                </Text>
              </View>
            </Pressable>
          ))}
        </>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  input: {
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.lg,
    height: 44,
    fontFamily: fonts.regular,
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: spacing.sm },
  name: { fontFamily: fonts.semibold, fontSize: fontSize.sm, color: colors.text },
  meta: { fontFamily: fonts.regular, fontSize: fontSize.xs, color: colors.textMuted },
  thumb: { width: 40, height: 40, borderRadius: radius.sm },
});
