import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useUsers } from '@/hooks/api';
import { useI18n } from '@/i18n';
import { Avatar, Header, Screen, SegmentedTabs } from '@/shared/components';
import { useUser } from '@/stores/session';
import { colors, fonts, fontSize, radius, spacing } from '@/theme';

const KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '*', '0', '#'];

/** "Ask Team in Real Time" (Figure 3.2): keypad + SAT contacts by country. */
export default function CallHome() {
  const { t } = useI18n();
  const me = useUser();
  const users = useUsers();
  const [tab, setTab] = useState<'contacts' | 'keypad'>('contacts');
  const [number, setNumber] = useState('');
  const [q, setQ] = useState('');

  const contacts = (users.data ?? [])
    .filter((u) => u.id !== me.id && (u.department === 'SAT' || u.role === 'instructor'))
    .filter((u) => !q.trim() || `${u.name} ${u.country}`.toLowerCase().includes(q.trim().toLowerCase()))
    .sort((a, b) => Number(b.online) - Number(a.online));

  const call = (userId: string, mode: 'video' | 'audio' = 'video') => router.push({ pathname: '/call/[userId]', params: { userId, mode } });

  return (
    <Screen header={<Header title={t('assistance.call')} home={false} />} padded={false}>
      <SegmentedTabs
        showIcons={false}
        items={[
          { key: 'contacts', label: t('call.contacts') },
          { key: 'keypad', label: t('call.keypad') },
        ]}
        value={tab}
        onChange={setTab}
      />
      {tab === 'keypad' ? (
        <View style={styles.keypad}>
          <Text style={styles.number}>{number || ' '}</Text>
          <View style={styles.keys}>
            {KEYS.map((k) => (
              <Pressable
                key={k}
                style={styles.key}
                onPress={() => setNumber((n) => n + k)}
                accessibilityRole="button"
                accessibilityLabel={k}
              >
                <Text style={styles.keyText}>{k}</Text>
              </Pressable>
            ))}
          </View>
          <View style={styles.keyActions}>
            <View style={{ width: 56 }} />
            <Pressable
              style={styles.callBtn}
              onPress={() => number && call('u-roberto', 'audio')}
              accessibilityRole="button"
              accessibilityLabel={t('call.audio')}
            >
              <Ionicons name="call" size={30} color={colors.white} />
            </Pressable>
            <Pressable
              style={{ width: 56, alignItems: 'center' }}
              onPress={() => setNumber((n) => n.slice(0, -1))}
              accessibilityLabel="delete"
            >
              <Ionicons name="backspace-outline" size={28} color={colors.textMuted} />
            </Pressable>
          </View>
        </View>
      ) : (
        <View style={{ padding: spacing.lg }}>
          <View style={styles.search}>
            <TextInput value={q} onChangeText={setQ} placeholder={t('common.search')} style={{ flex: 1, fontFamily: fonts.regular }} />
            <Ionicons name="search" size={18} color={colors.primary} />
          </View>
          {contacts.map((u) => (
            <View key={u.id} style={styles.contact}>
              <Avatar user={u} size={38} />
              <View style={{ flex: 1 }}>
                <Text style={styles.name}>{u.name}</Text>
                <Text style={styles.meta}>
                  {u.department} | {u.country} · {u.online ? t('common.online') : t('common.offline')}
                </Text>
              </View>
              <Pressable
                style={[styles.round, { backgroundColor: colors.green }]}
                onPress={() => call(u.id, 'audio')}
                accessibilityLabel={`${t('call.audio')} ${u.name}`}
              >
                <Ionicons name="call" size={16} color={colors.white} />
              </Pressable>
              <Pressable
                testID={`video-${u.id}`}
                style={[styles.round, { backgroundColor: colors.primary }]}
                onPress={() => call(u.id, 'video')}
                accessibilityLabel={`${t('call.videoCall')} ${u.name}`}
              >
                <Ionicons name="videocam" size={16} color={colors.white} />
              </Pressable>
            </View>
          ))}
          <Text style={styles.note}>{t('call.simulatedNote')}</Text>
        </View>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  keypad: { alignItems: 'center', padding: spacing.xl },
  number: { fontFamily: fonts.medium, fontSize: 30, color: colors.text, letterSpacing: 2, marginBottom: spacing.lg, minHeight: 40 },
  keys: { flexDirection: 'row', flexWrap: 'wrap', width: 270, justifyContent: 'space-between', rowGap: spacing.lg },
  key: {
    width: 74,
    height: 74,
    borderRadius: 37,
    borderWidth: 2,
    borderColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  keyText: { fontFamily: fonts.semibold, fontSize: 28, color: colors.primary },
  keyActions: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', width: 270, marginTop: spacing.xl },
  callBtn: { width: 72, height: 72, borderRadius: 36, backgroundColor: colors.green, alignItems: 'center', justifyContent: 'center' },
  search: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    height: 40,
    marginBottom: spacing.md,
  },
  contact: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderColor: '#F0F0F0',
  },
  name: { fontFamily: fonts.semibold, fontSize: fontSize.sm, color: colors.text },
  meta: { fontFamily: fonts.regular, fontSize: 11, color: colors.textMuted },
  round: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center' },
  note: { fontFamily: fonts.regular, fontSize: 11, color: colors.textMuted, marginTop: spacing.xl, textAlign: 'center' },
});
