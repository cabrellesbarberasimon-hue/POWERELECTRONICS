import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useEquipment, useUsers } from '@/hooks/api';
import { useI18n } from '@/i18n';
import { ARView, partPosition } from '@/modules/training/ARView';
import { Avatar, Loading, type Stroke } from '@/shared/components';
import { colors, fonts, fontSize, radius, spacing } from '@/theme';

/**
 * Simulated video call with shared AR view. The remote instructor "annotates"
 * the trainee's AR scene (a scripted stroke around the DC lever); the local
 * user can draw too. Integration point for WebRTC/Agora/Twilio: see README.
 */
export default function VideoCall() {
  const { userId, mode } = useLocalSearchParams<{ userId: string; mode?: 'audio' | 'video' }>();
  const { t } = useI18n();
  const insets = useSafeAreaInsets();
  const users = useUsers();
  const equipment = useEquipment('freesun-hemk');
  const [state, setState] = useState<'calling' | 'connected'>('calling');
  const [seconds, setSeconds] = useState(0);
  const [muted, setMuted] = useState(false);
  const [camera, setCamera] = useState(mode !== 'audio');
  const [annotate, setAnnotate] = useState(false);
  const [strokes, setStrokes] = useState<Stroke[]>([]);
  const [remoteNote, setRemoteNote] = useState(false);
  const [size, setSize] = useState({ w: 0, h: 0 });

  const remote = users.data?.find((u) => u.id === userId);

  useEffect(() => {
    const id = setTimeout(() => setState('connected'), 2000);
    return () => clearTimeout(id);
  }, []);

  useEffect(() => {
    if (state !== 'connected') return;
    const id = setInterval(() => setSeconds((s) => s + 1), 1000);
    // Scripted remote annotation: circle + arrow around the panel 2 lever.
    const a = setTimeout(() => {
      const lever = equipment.data?.parts.find((p) => p.id === 'p-lever');
      if (!size.w || !lever) return;
      const { x: cx, y: cy } = partPosition(lever, size.w, size.h);
      const r = 34;
      const circle = Array.from({ length: 25 }, (_, i) => {
        const ang = (i / 24) * Math.PI * 2;
        return `${i ? 'L' : 'M'}${(cx + r * Math.cos(ang)).toFixed(1)} ${(cy + r * Math.sin(ang)).toFixed(1)}`;
      }).join(' ');
      setStrokes((s) => [...s, { d: circle, color: colors.orange }, { d: `M${cx + 90} ${cy - 80} L${cx + r + 6} ${cy - 10}`, color: colors.orange }]);
      setRemoteNote(true);
    }, 2500);
    return () => {
      clearInterval(id);
      clearTimeout(a);
    };
  }, [state, size.w, size.h, equipment.data]);

  if (!equipment.data) return <Loading />;
  const mmss = `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;

  return (
    <View style={styles.root}>
      <View style={{ flex: 1 }} onLayout={(e) => setSize({ w: e.nativeEvent.layout.width, h: e.nativeEvent.layout.height })}>
        {camera ? (
          <ARView equipment={equipment.data} hotspots={[{ partId: 'p-lever', pulse: true }]} drawing={annotate} strokes={strokes} onStrokes={setStrokes} />
        ) : (
          <View style={[StyleSheet.absoluteFill, { backgroundColor: colors.navy }]} />
        )}
      </View>

      {/* remote participant tile */}
      <View style={[styles.remote, { top: insets.top + spacing.md }]}>
        <Avatar user={remote} size={56} />
        <Text style={styles.remoteName}>{remote?.name}</Text>
        <Text style={styles.remoteState}>{state === 'calling' ? t('call.calling') : `${t('call.connected')} · ${mmss}`}</Text>
      </View>

      {remoteNote && remote && (
        <View style={[styles.banner, { top: insets.top + 130 }]}>
          <MaterialCommunityIcons name="draw" size={16} color={colors.white} />
          <Text style={styles.bannerText}>{t('call.instructorAnnotating', { name: remote.name.split(' ')[0] })}</Text>
        </View>
      )}

      <View style={[styles.controls, { paddingBottom: insets.bottom + spacing.lg }]}>
        <Control icon={muted ? 'mic-off' : 'mic'} label={t('call.mute')} on={muted} onPress={() => setMuted((m) => !m)} />
        <Control icon={camera ? 'videocam' : 'videocam-off'} label={t('call.camera')} on={!camera} onPress={() => setCamera((c) => !c)} />
        <Control icon="brush" label={t('call.annotate')} on={annotate} onPress={() => setAnnotate((a) => !a)} />
        <Control icon="call" label={t('call.end')} danger onPress={() => router.back()} testID="end-call" />
      </View>
      <Text style={[styles.note, { bottom: insets.bottom + 100 }]}>{t('call.simulatedNote')}</Text>
    </View>
  );
}

function Control({ icon, label, onPress, on, danger, testID }: { icon: keyof typeof Ionicons.glyphMap; label: string; onPress: () => void; on?: boolean; danger?: boolean; testID?: string }) {
  return (
    <Pressable onPress={onPress} style={styles.control} accessibilityRole="button" accessibilityLabel={label} testID={testID}>
      <View style={[styles.controlCircle, on && { backgroundColor: colors.white }, danger && { backgroundColor: colors.red }]}>
        <Ionicons name={icon} size={24} color={on ? colors.navy : colors.white} style={danger ? { transform: [{ rotate: '135deg' }] } : undefined} />
      </View>
      <Text style={styles.controlText}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.black },
  remote: { position: 'absolute', right: spacing.lg, width: 130, backgroundColor: 'rgba(6,32,91,0.85)', borderRadius: radius.lg, padding: spacing.md, alignItems: 'center', gap: 4 },
  remoteName: { color: colors.white, fontFamily: fonts.semibold, fontSize: fontSize.sm, textAlign: 'center' },
  remoteState: { color: 'rgba(255,255,255,0.8)', fontFamily: fonts.regular, fontSize: 10 },
  banner: { position: 'absolute', left: spacing.lg, right: spacing.lg, flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: colors.orange, borderRadius: radius.pill, paddingHorizontal: spacing.md, paddingVertical: 6 },
  bannerText: { color: colors.white, fontFamily: fonts.medium, fontSize: 12, flex: 1 },
  controls: { position: 'absolute', left: 0, right: 0, bottom: 0, flexDirection: 'row', justifyContent: 'space-around', paddingTop: spacing.lg, backgroundColor: 'rgba(0,0,0,0.55)' },
  control: { alignItems: 'center', gap: 4, width: 76 },
  controlCircle: { width: 54, height: 54, borderRadius: 27, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },
  controlText: { color: colors.white, fontFamily: fonts.medium, fontSize: 11 },
  note: { position: 'absolute', left: spacing.lg, right: spacing.lg, color: 'rgba(0,0,0,0.55)', fontFamily: fonts.regular, fontSize: 10, textAlign: 'center' },
});
