import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useAddTeamNotification, useEquipment, useTeamNotifications, useUsers } from '@/hooks/api';
import { useI18n } from '@/i18n';
import { AudioWave, Chip, EmptyState, Header, LinearProgress, Loading, PrimaryButton, Screen } from '@/shared/components';
import { useUser } from '@/stores/session';
import { colors, fonts, fontSize, radius, spacing } from '@/theme';
import type { TeamNotification } from '@/types/domain';

type Topic = TeamNotification['topic'];

/** Team Notifications (Figure 3.2): text, voice or video messages filterable by equipment/topic/date. */
export default function Notifications() {
  const { equipmentId } = useLocalSearchParams<{ equipmentId: string }>();
  const { t, tr, formatDate, formatTime } = useI18n();
  const [topic, setTopic] = useState<Topic | undefined>();
  const [order, setOrder] = useState<'newest' | 'oldest'>('newest');
  const [compose, setCompose] = useState<TeamNotification['kind'] | null>(null);
  const [fab, setFab] = useState(false);
  const equipment = useEquipment(equipmentId);
  const list = useTeamNotifications(equipmentId, { topic, order });
  const users = useUsers();

  return (
    <View style={{ flex: 1 }}>
      <Screen header={<Header title={t('assistance.notifications')} home={false} />}>
        <View style={styles.filters}>
          <Text style={styles.family}>{equipment.data?.family}</Text>
          <Chip label={t('assistance.filterAll')} active={!topic} onPress={() => setTopic(undefined)} />
          {(['technical', 'maintenance', 'safety'] as const).map((tp) => (
            <Chip key={tp} label={t(`assistance.topic.${tp}`)} active={topic === tp} onPress={() => setTopic(tp)} />
          ))}
          <Chip
            icon={order === 'newest' ? 'arrow-down' : 'arrow-up'}
            label={t(`assistance.${order}`)}
            onPress={() => setOrder((o) => (o === 'newest' ? 'oldest' : 'newest'))}
          />
        </View>
        {!list.data ? (
          <Loading />
        ) : list.data.length === 0 ? (
          <EmptyState text={t('common.empty')} />
        ) : (
          list.data.map((n) => {
            const author = users.data?.find((u) => u.id === n.authorId);
            return (
              <View key={n.id} style={styles.card}>
                <View style={styles.bang}>
                  <Text style={styles.bangText}>!</Text>
                </View>
                <View style={{ flex: 1, gap: 2 }}>
                  <Text style={styles.name}>{author?.name}</Text>
                  <Text style={styles.kind}>
                    {n.kind === 'video'
                      ? t('assistance.videoMessage')
                      : n.kind === 'voice'
                        ? t('assistance.voiceMessage')
                        : t('assistance.note')}
                  </Text>
                  <Text style={styles.meta}>
                    {t('assistance.lastRevision', { date: formatDate(n.createdAt), time: formatTime(n.createdAt) })}
                  </Text>
                  <Text style={styles.text}>{tr(n.text)}</Text>
                  {n.kind === 'voice' && <AudioWave durationSec={n.durationSec} compact />}
                  {n.kind === 'video' && <VideoBar durationSec={n.durationSec ?? 30} />}
                </View>
              </View>
            );
          })
        )}
      </Screen>

      {fab && (
        <View style={styles.fabMenu}>
          {(['note', 'voice', 'video'] as const).map((k) => (
            <Pressable
              key={k}
              style={styles.fabItem}
              onPress={() => {
                setFab(false);
                setCompose(k);
              }}
              accessibilityRole="button"
              accessibilityLabel={k}
            >
              <View style={styles.fabSmall}>
                <Ionicons name={k === 'note' ? 'create' : k === 'voice' ? 'mic' : 'videocam'} size={20} color={colors.white} />
              </View>
              <Text style={styles.fabLabel}>
                {k === 'note' ? t('assistance.note') : k === 'voice' ? t('assistance.voice') : t('assistance.video')}
              </Text>
            </Pressable>
          ))}
        </View>
      )}
      <Pressable
        testID="notif-add"
        style={styles.fab}
        onPress={() => setFab((f) => !f)}
        accessibilityRole="button"
        accessibilityLabel={t('assistance.newMessage')}
      >
        <Ionicons name={fab ? 'close' : 'add'} size={30} color={colors.white} />
      </Pressable>

      {compose && <Composer kind={compose} equipmentId={equipmentId} onClose={() => setCompose(null)} />}
    </View>
  );
}

function VideoBar({ durationSec }: { durationSec: number }) {
  const [playing, setPlaying] = useState(false);
  const [p, setP] = useState(0);
  useEffect(() => {
    if (!playing) return;
    const id = setInterval(() => setP((x) => (x >= 100 ? (setPlaying(false), 0) : x + 100 / durationSec)), 1000);
    return () => clearInterval(id);
  }, [playing, durationSec]);
  return (
    <View style={styles.video}>
      <Pressable onPress={() => setPlaying((v) => !v)} accessibilityRole="button" accessibilityLabel="play">
        <Ionicons name={playing ? 'pause-circle-outline' : 'play-circle-outline'} size={30} color={colors.primary} />
      </Pressable>
      <View style={{ flex: 1 }}>
        <LinearProgress percent={p} height={4} />
      </View>
      <Text style={styles.meta}>{durationSec}s</Text>
    </View>
  );
}

function Composer({ kind, equipmentId, onClose }: { kind: TeamNotification['kind']; equipmentId: string; onClose: () => void }) {
  const { t } = useI18n();
  const user = useUser();
  const add = useAddTeamNotification();
  const [text, setText] = useState('');
  const [topic, setTopic] = useState<Topic>('technical');
  const [seconds, setSeconds] = useState(0);
  useEffect(() => {
    if (kind === 'note') return;
    const id = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(id);
  }, [kind]);

  const send = () =>
    add.mutate(
      {
        equipmentId,
        authorId: user.id,
        kind,
        topic,
        text: text.trim() || (kind === 'voice' ? t('assistance.voiceMessage') : t('assistance.videoMessage')),
        durationSec: kind === 'note' ? undefined : Math.max(3, seconds),
      },
      { onSuccess: onClose },
    );

  return (
    <Modal transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.sheetWrap}>
        <View style={styles.sheet}>
          <Text style={styles.sheetTitle}>{t('assistance.newMessage')}</Text>
          {kind !== 'note' && (
            <View style={styles.rec}>
              <View style={styles.recDot} />
              <Text style={styles.recText}>
                {t('assistance.recording')} {seconds}s
              </Text>
            </View>
          )}
          <TextInput value={text} onChangeText={setText} placeholder={t('assistance.messagePlaceholder')} multiline style={styles.input} />
          <View style={{ flexDirection: 'row', gap: spacing.sm, flexWrap: 'wrap' }}>
            {(['technical', 'maintenance', 'safety'] as const).map((tp) => (
              <Chip key={tp} label={t(`assistance.topic.${tp}`)} active={topic === tp} onPress={() => setTopic(tp)} />
            ))}
          </View>
          <View style={{ flexDirection: 'row', gap: spacing.md, marginTop: spacing.lg }}>
            <PrimaryButton label={t('common.cancel')} onPress={onClose} style={{ flex: 1, backgroundColor: colors.textMuted }} />
            <PrimaryButton label={t('common.send')} icon="send" onPress={send} loading={add.isPending} style={{ flex: 1 }} />
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  filters: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, alignItems: 'center', marginBottom: spacing.lg },
  family: { fontFamily: fonts.regular, color: colors.textMuted, marginRight: spacing.sm },
  card: {
    flexDirection: 'row',
    gap: spacing.md,
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  bang: { width: 48, height: 48, borderRadius: 24, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  bangText: { color: colors.white, fontFamily: fonts.bold, fontSize: 26 },
  name: { fontFamily: fonts.semibold, fontSize: fontSize.md, color: colors.primary },
  kind: { fontFamily: fonts.regular, fontSize: fontSize.xs, color: colors.text },
  meta: { fontFamily: fonts.regular, fontSize: 10, color: colors.textMuted },
  text: { fontFamily: fonts.regular, fontSize: fontSize.sm, color: colors.text, marginVertical: 4 },
  video: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  fab: {
    position: 'absolute',
    alignSelf: 'center',
    bottom: spacing.xxl,
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 6,
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 6,
  },
  fabMenu: {
    position: 'absolute',
    bottom: 110,
    alignSelf: 'center',
    flexDirection: 'row',
    gap: spacing.lg,
    backgroundColor: colors.white,
    borderRadius: radius.xl,
    padding: spacing.md,
    elevation: 6,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  fabItem: { alignItems: 'center', gap: 4 },
  fabSmall: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  fabLabel: { fontFamily: fonts.medium, fontSize: 11, color: colors.navy },
  sheetWrap: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.35)' },
  sheet: {
    backgroundColor: colors.white,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    padding: spacing.lg,
    gap: spacing.md,
    paddingBottom: spacing.xxl,
  },
  sheetTitle: { fontFamily: fonts.semibold, fontSize: fontSize.lg },
  rec: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  recDot: { width: 12, height: 12, borderRadius: 6, backgroundColor: colors.red },
  recText: { fontFamily: fonts.medium, color: colors.red },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.md,
    minHeight: 80,
    textAlignVertical: 'top',
    fontFamily: fonts.regular,
  },
});
