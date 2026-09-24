import { useEffect, useState, type Dispatch, type ReactNode, type SetStateAction } from 'react';
import { Animated, Easing, PanResponder, Pressable, StyleSheet, Text, View } from 'react-native';
import { useI18n } from '@/i18n';
import { CameraBackdrop, DrawingLayer, type CameraBackdropHandle, type Stroke } from '@/shared/components';
import { colors, fonts, spacing } from '@/theme';
import type { Equipment, EquipmentPart } from '@/types/domain';
import { CABINET_RATIO, FreesunCabinet } from './FreesunCabinet';

/** Cabinet box inside an AR view of w×h: slightly wider than the screen, as in the mockups. */
export function cabinetLayout(w: number, h: number) {
  const cabW = Math.min(w * 1.12, h * 0.55 * CABINET_RATIO);
  const cabH = cabW / CABINET_RATIO;
  return { cabW, cabH, left: (w - cabW) / 2, top: (h - cabH) / 2 - h * 0.04 };
}

/** Screen position of a part hotspot inside an AR view of w×h. */
export function partPosition(part: Pick<EquipmentPart, 'x' | 'y'>, w: number, h: number) {
  const { cabW, cabH, left, top } = cabinetLayout(w, h);
  return { x: left + part.x * cabW, y: top + part.y * cabH };
}

const DOT: Record<EquipmentPart['dot'], string> = { red: colors.red, blue: colors.primary, orange: '#F5A623', green: colors.green };

export interface ARViewProps {
  equipment: Equipment;
  /** Parts that show a tappable hotspot. */
  hotspots: { partId: string; color?: string; pulse?: boolean; dim?: boolean }[];
  onPartPress?: (part: EquipmentPart) => void;
  selectedPartId?: string;
  drawing?: boolean;
  strokes?: Stroke[];
  /** A state setter (accepts updaters), e.g. the `setStrokes` of useState. */
  onStrokes?: Dispatch<SetStateAction<Stroke[]>>;
  rotate3d?: boolean;
  /** Force the static demo image (no camera). */
  demo?: boolean;
  cameraRef?: React.Ref<CameraBackdropHandle>;
  overlay?: ReactNode;
}

/**
 * Simulated Augmented Reality: camera feed (or demo backdrop), a "marker
 * detection" phase, then the equipment model with interactive hotspots.
 * Replace with ViroReact / ARKit / ARCore anchors for real tracking (README).
 */
export function ARView({
  equipment,
  hotspots,
  onPartPress,
  selectedPartId,
  drawing,
  strokes = [],
  onStrokes,
  rotate3d,
  demo,
  cameraRef,
  overlay,
}: ARViewProps) {
  const { t, tr } = useI18n();
  const [size, setSize] = useState({ w: 0, h: 0 });
  const [live, setLive] = useState(false);
  const [detected, setDetected] = useState(false);
  const [scan] = useState(() => new Animated.Value(0));
  const [pulse] = useState(() => new Animated.Value(0));
  const [angle, setAngle] = useState(0);

  useEffect(() => {
    const s = Animated.loop(
      Animated.timing(scan, { toValue: 1, duration: 1100, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
    );
    s.start();
    const id = setTimeout(() => setDetected(true), 1400);
    const p = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 700, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0, duration: 700, useNativeDriver: true }),
      ]),
    );
    p.start();
    return () => {
      s.stop();
      p.stop();
      clearTimeout(id);
    };
  }, [scan, pulse]);

  const shownAngle = rotate3d ? angle : 0;

  const [rotator] = useState(() => {
    let lastDx = 0;
    return PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        lastDx = 0;
      },
      onPanResponderMove: (_, g) => {
        const d = g.dx - lastDx;
        lastDx = g.dx;
        setAngle((a) => Math.max(-55, Math.min(55, a + d / 3)));
      },
    });
  });

  const { cabW, cabH, left, top } = cabinetLayout(size.w, size.h);

  return (
    <View style={styles.root} onLayout={(e) => setSize({ w: e.nativeEvent.layout.width, h: e.nativeEvent.layout.height })}>
      <CameraBackdrop
        ref={cameraRef}
        demo={demo}
        onModeChange={setLive}
        fallback={<View style={[StyleSheet.absoluteFill, { backgroundColor: '#E9EDF1' }]} />}
      />

      {size.w > 0 && detected && (
        <View
          style={{
            position: 'absolute',
            left,
            top,
            width: cabW,
            height: cabH,
            opacity: live ? 0.88 : 1,
            transform: [{ perspective: 900 }, { rotateY: `${shownAngle}deg` }],
          }}
          {...(rotate3d ? rotator.panHandlers : {})}
        >
          <FreesunCabinet width={cabW} />
          {hotspots.map((h) => {
            const part = equipment.parts.find((p) => p.id === h.partId);
            if (!part) return null;
            const color = h.color ?? DOT[part.dot];
            const selected = selectedPartId === part.id;
            return (
              <Pressable
                key={part.id}
                onPress={() => onPartPress?.(part)}
                hitSlop={14}
                accessibilityRole="button"
                accessibilityLabel={tr(part.name)}
                testID={`hotspot-${part.id}`}
                style={[styles.hotspot, { left: part.x * cabW - 11, top: part.y * cabH - 11, opacity: h.dim ? 0.35 : 1 }]}
              >
                {(h.pulse || selected) && (
                  <Animated.View
                    style={[
                      styles.ring,
                      {
                        borderColor: color,
                        opacity: pulse.interpolate({ inputRange: [0, 1], outputRange: [0.9, 0.1] }),
                        transform: [{ scale: pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 2.2] }) }],
                      },
                    ]}
                  />
                )}
                <View style={[styles.dot, { backgroundColor: color }, selected && styles.dotSelected]} />
              </Pressable>
            );
          })}
        </View>
      )}

      {!detected && (
        <View style={StyleSheet.absoluteFill} pointerEvents="none">
          <Animated.View
            style={[
              styles.scanLine,
              { transform: [{ translateY: scan.interpolate({ inputRange: [0, 1], outputRange: [size.h * 0.2, size.h * 0.8] }) }] },
            ]}
          />
          <View style={styles.scanBadge}>
            <Text style={styles.scanText}>{t('training.scanning')}</Text>
          </View>
        </View>
      )}
      {detected && (
        <View style={styles.detected} pointerEvents="none">
          <Text style={styles.detectedText}>{live ? `◉ ${t('training.detected')}` : `◎ ${t('training.cameraOff')}`}</Text>
        </View>
      )}

      {onStrokes && <DrawingLayer enabled={!!drawing} strokes={strokes} onChange={onStrokes} />}
      {overlay}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, overflow: 'hidden', backgroundColor: '#E9EDF1' },
  hotspot: { position: 'absolute', width: 22, height: 22, alignItems: 'center', justifyContent: 'center' },
  dot: { width: 16, height: 16, borderRadius: 8, borderWidth: 2, borderColor: colors.white },
  dotSelected: { width: 20, height: 20, borderRadius: 10, borderWidth: 3 },
  ring: { position: 'absolute', width: 22, height: 22, borderRadius: 11, borderWidth: 3 },
  scanLine: {
    position: 'absolute',
    left: '8%',
    right: '8%',
    height: 3,
    backgroundColor: colors.primary,
    shadowColor: colors.primary,
    shadowOpacity: 0.8,
    shadowRadius: 8,
  },
  scanBadge: {
    position: 'absolute',
    top: spacing.lg,
    alignSelf: 'center',
    backgroundColor: 'rgba(6,32,91,0.75)',
    borderRadius: 20,
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
  },
  scanText: { color: colors.white, fontFamily: fonts.medium, fontSize: 12 },
  detected: {
    position: 'absolute',
    top: spacing.sm,
    left: spacing.sm,
    backgroundColor: 'rgba(255,255,255,0.85)',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  detectedText: { color: colors.navy, fontFamily: fonts.medium, fontSize: 10 },
});
