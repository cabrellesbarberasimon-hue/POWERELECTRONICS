import { Ionicons } from '@expo/vector-icons';
import { useEffect, useMemo, useState } from 'react';
import { Animated, Easing, Image, Pressable, StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import Svg, { Circle, Ellipse, Path, Rect } from 'react-native-svg';
import type { Media } from '@/types/domain';
import { colors, fonts, radius, spacing } from '@/theme';

// ---------------------------------------------------------------------------
// Animated avatars (predefined characters overlaid on content, Figure 2).
// Real motion-scan avatars are a future feature (see README).
// ---------------------------------------------------------------------------

export const AVATARS = [
  { id: 'engineer', shirt: '#E6356F', hair: '#3B2A20', skin: '#F2C7A5', pants: '#1F2A44' },
  { id: 'technician', shirt: '#1E88C4', hair: '#1B1B1B', skin: '#C98E6B', pants: '#2F3B52' },
  { id: 'instructor', shirt: '#FE6320', hair: '#8A5A2B', skin: '#F0C09A', pants: '#263238' },
  { id: 'robot', shirt: '#9AA5B1', hair: '#9AA5B1', skin: '#CFD8DC', pants: '#607D8B' },
] as const;
export type AvatarId = (typeof AVATARS)[number]['id'];

export function AvatarCharacter({ id, height = 220, animated = true }: { id: string; height?: number; animated?: boolean }) {
  const a = AVATARS.find((x) => x.id === id) ?? AVATARS[0];
  const [bob] = useState(() => new Animated.Value(0));
  const [wave] = useState(() => new Animated.Value(0));

  useEffect(() => {
    if (!animated) return;
    const loops = [
      Animated.loop(
        Animated.sequence([
          Animated.timing(bob, { toValue: 1, duration: 900, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
          Animated.timing(bob, { toValue: 0, duration: 900, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        ]),
      ),
      Animated.loop(
        Animated.sequence([
          Animated.timing(wave, { toValue: 1, duration: 400, useNativeDriver: true }),
          Animated.timing(wave, { toValue: -1, duration: 400, useNativeDriver: true }),
          Animated.timing(wave, { toValue: 0, duration: 300, useNativeDriver: true }),
          Animated.delay(900),
        ]),
      ),
    ];
    loops.forEach((l) => l.start());
    return () => loops.forEach((l) => l.stop());
  }, [animated, bob, wave]);

  const w = height * 0.5;
  const robot = a.id === 'robot';
  return (
    <Animated.View
      style={{ width: w, height, transform: [{ translateY: bob.interpolate({ inputRange: [0, 1], outputRange: [0, -6] }) }] }}
      accessibilityLabel={`avatar ${a.id}`}
    >
      <Svg width={w} height={height} viewBox="0 0 100 200">
        {/* legs */}
        <Rect x={36} y={112} width={12} height={70} rx={5} fill={a.pants} />
        <Rect x={52} y={112} width={12} height={70} rx={5} fill={a.pants} />
        <Ellipse cx={40} cy={186} rx={11} ry={6} fill={colors.primary} />
        <Ellipse cx={60} cy={186} rx={11} ry={6} fill={colors.primary} />
        {/* body + left arm */}
        <Rect x={30} y={58} width={40} height={60} rx={14} fill={a.shirt} />
        <Rect x={20} y={62} width={11} height={50} rx={5} fill={a.shirt} />
        <Circle cx={25} cy={114} r={5} fill={a.skin} />
        {/* head */}
        {robot ? (
          <>
            <Rect x={32} y={16} width={36} height={36} rx={8} fill={a.skin} />
            <Circle cx={43} cy={33} r={4} fill={colors.primary} />
            <Circle cx={57} cy={33} r={4} fill={colors.primary} />
            <Rect x={48} y={6} width={4} height={10} fill={a.hair} />
            <Circle cx={50} cy={6} r={4} fill={colors.orange} />
          </>
        ) : (
          <>
            <Path d="M28 40 Q28 8 50 8 Q72 8 72 40 L72 60 Q66 52 64 40 L36 40 Q34 52 28 60 Z" fill={a.hair} />
            <Circle cx={50} cy={34} r={16} fill={a.skin} />
            <Path d="M34 30 Q40 14 64 24 Q60 16 50 16 Q36 16 34 30 Z" fill={a.hair} />
            <Circle cx={44} cy={34} r={1.8} fill="#222" />
            <Circle cx={56} cy={34} r={1.8} fill="#222" />
            <Path d="M44 41 Q50 46 56 41" stroke="#B03A48" strokeWidth={2} fill="none" strokeLinecap="round" />
          </>
        )}
      </Svg>
      {/* waving right arm */}
      <Animated.View
        style={{
          position: 'absolute',
          left: w * 0.68,
          top: height * 0.3,
          width: w * 0.12,
          height: height * 0.26,
          transform: [
            { translateY: -height * 0.1 },
            { rotate: wave.interpolate({ inputRange: [-1, 1], outputRange: ['-25deg', '25deg'] }) },
            { translateY: height * 0.1 },
          ],
        }}
      >
        <View style={{ flex: 1, backgroundColor: a.shirt, borderRadius: 6 }} />
        <View
          style={{ position: 'absolute', bottom: -6, left: 0, right: 0, height: w * 0.12, borderRadius: 99, backgroundColor: a.skin }}
        />
      </Animated.View>
    </Animated.View>
  );
}

// ---------------------------------------------------------------------------
// Audio message with fake waveform (Community / Team Notifications)
// ---------------------------------------------------------------------------

export function AudioWave({
  durationSec = 30,
  color = colors.primary,
  compact,
}: {
  durationSec?: number;
  color?: string;
  compact?: boolean;
}) {
  const [playing, setPlaying] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const bars = useMemo(
    () => Array.from({ length: compact ? 22 : 32 }, (_, i) => 0.25 + Math.abs(Math.sin(i * 1.7) * Math.cos(i * 0.6))),
    [compact],
  );

  useEffect(() => {
    if (!playing) return;
    const id = setInterval(() => {
      setElapsed((e) => {
        if (e + 1 >= durationSec) {
          setPlaying(false);
          return 0;
        }
        return e + 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [playing, durationSec]);

  const pct = elapsed / durationSec;
  const fmt = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
  return (
    <View style={[styles.audio, { borderColor: color }]}>
      <Pressable
        onPress={() => setPlaying((p) => !p)}
        accessibilityRole="button"
        accessibilityLabel={playing ? 'pause' : 'play'}
        style={[styles.play, { backgroundColor: color }]}
      >
        <Ionicons name={playing ? 'pause' : 'play'} size={14} color={colors.white} />
      </Pressable>
      <View style={styles.bars}>
        {bars.map((h, i) => (
          <View
            key={i}
            style={{
              flex: 1,
              marginHorizontal: 0.8,
              height: `${h * 100}%`,
              borderRadius: 2,
              backgroundColor: i / bars.length <= pct ? color : `${color}66`,
            }}
          />
        ))}
      </View>
      <Text style={[styles.time, { color }]}>{fmt(playing ? elapsed : durationSec)}</Text>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Placeholder renderer for post media (no real video files in the prototype)
// ---------------------------------------------------------------------------

const KIND_ICON: Record<Media['kind'], keyof typeof Ionicons.glyphMap> = {
  video: 'play-circle',
  image: 'image',
  audio: 'mic',
  text: 'chatbox-ellipses',
  '3d': 'cube',
};

export function MediaView({ media, style, large }: { media: Media; style?: StyleProp<ViewStyle>; large?: boolean }) {
  const dark = media.tint !== '#F5F6F8' && media.tint !== '#fff';
  return (
    <View style={[styles.media, { backgroundColor: media.tint }, style]}>
      {media.uri ? <Image source={{ uri: media.uri }} style={StyleSheet.absoluteFill} resizeMode="cover" /> : <PanelPattern dark={dark} />}
      {media.avatarId && (
        <View style={styles.mediaAvatar}>
          <AvatarCharacter id={media.avatarId} height={large ? 300 : 96} />
        </View>
      )}
      {media.kind === 'audio' ? (
        <View style={{ width: '80%' }}>
          <AudioWave durationSec={media.durationSec} color={colors.white} />
        </View>
      ) : (
        !media.avatarId && (
          <Ionicons name={KIND_ICON[media.kind]} size={large ? 84 : 42} color={dark ? 'rgba(255,255,255,0.9)' : colors.primary} />
        )
      )}
      {media.durationSec && media.kind === 'video' ? (
        <View style={styles.duration}>
          <Ionicons name="videocam" size={12} color={colors.white} />
          <Text style={styles.durationText}>{media.durationSec}s</Text>
        </View>
      ) : null}
    </View>
  );
}

/** Subtle solar-panel grid pattern used as placeholder background. */
function PanelPattern({ dark }: { dark: boolean }) {
  const stroke = dark ? 'rgba(255,255,255,0.12)' : 'rgba(30,136,196,0.12)';
  return (
    <Svg width="100%" height="100%" style={StyleSheet.absoluteFill} viewBox="0 0 100 100" preserveAspectRatio="none">
      {Array.from({ length: 9 }, (_, i) => (
        <Path key={`v${i}`} d={`M${(i + 1) * 10} 0 L${(i + 1) * 10 - 8} 100`} stroke={stroke} strokeWidth={0.6} />
      ))}
      {Array.from({ length: 9 }, (_, i) => (
        <Path key={`h${i}`} d={`M0 ${(i + 1) * 10} L100 ${(i + 1) * 10}`} stroke={stroke} strokeWidth={0.6} />
      ))}
    </Svg>
  );
}

const styles = StyleSheet.create({
  audio: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 2,
    borderRadius: radius.pill,
    paddingHorizontal: 6,
    paddingVertical: 4,
    gap: 6,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  play: { width: 26, height: 26, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  bars: { flex: 1, height: 22, flexDirection: 'row', alignItems: 'center' },
  time: { fontFamily: fonts.medium, fontSize: 10, minWidth: 28, textAlign: 'right' },
  media: { borderRadius: radius.lg, overflow: 'hidden', alignItems: 'center', justifyContent: 'center', minHeight: 140 },
  mediaAvatar: { position: 'absolute', bottom: spacing.sm, left: spacing.lg },
  duration: {
    position: 'absolute',
    right: 8,
    top: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: 'rgba(0,0,0,0.45)',
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  durationText: { color: colors.white, fontFamily: fonts.medium, fontSize: 10 },
});
