import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRef, useState } from 'react';
import { PanResponder, Pressable, StyleSheet, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { colors, spacing } from '@/theme';

export type AnnotationTool = 'pointer' | 'pen' | 'capture' | 'rotate' | 'share';

const TOOLS: { key: AnnotationTool; render: (c: string) => React.ReactNode }[] = [
  { key: 'pointer', render: (c) => <Ionicons name="navigate" size={24} color={c} style={{ transform: [{ rotate: '-45deg' }] }} /> },
  { key: 'pen', render: (c) => <MaterialCommunityIcons name="draw" size={26} color={c} /> },
  { key: 'capture', render: (c) => <MaterialCommunityIcons name="camera-switch-outline" size={26} color={c} /> },
  { key: 'rotate', render: (c) => <MaterialCommunityIcons name="rotate-3d-variant" size={26} color={c} /> },
  { key: 'share', render: (c) => <Ionicons name="share-social" size={24} color={c} /> },
];

/** Bottom toolbar from the mockups: pointer, pen, capture, 3D and share. */
export function AnnotationToolbar({
  active,
  onPress,
  labels,
}: {
  active?: AnnotationTool;
  onPress: (tool: AnnotationTool) => void;
  labels: Record<AnnotationTool, string>;
}) {
  return (
    <View style={styles.toolbar}>
      {TOOLS.map((t) => {
        const on = active === t.key;
        return (
          <Pressable
            key={t.key}
            onPress={() => onPress(t.key)}
            accessibilityRole="button"
            accessibilityLabel={labels[t.key]}
            accessibilityState={{ selected: on }}
            style={[styles.tool, on && styles.toolOn]}
          >
            {t.render(on ? colors.primary : colors.white)}
          </Pressable>
        );
      })}
    </View>
  );
}

export interface Stroke {
  d: string;
  color: string;
}

/**
 * Freehand drawing layer. Used for AR annotations (the instructor draws on
 * the trainee's view during a call) and to annotate captured content.
 */
export function DrawingLayer({ enabled, color = colors.orange, strokes, onChange }: { enabled: boolean; color?: string; strokes: Stroke[]; onChange: (s: Stroke[]) => void }) {
  const current = useRef<string>('');
  const [live, setLive] = useState('');
  const latest = useRef({ strokes, onChange, color });
  latest.current = { strokes, onChange, color };

  const responder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (e) => {
        const { locationX: x, locationY: y } = e.nativeEvent;
        current.current = `M${x.toFixed(1)} ${y.toFixed(1)}`;
        setLive(current.current);
      },
      onPanResponderMove: (e) => {
        const { locationX: x, locationY: y } = e.nativeEvent;
        current.current += ` L${x.toFixed(1)} ${y.toFixed(1)}`;
        setLive(current.current);
      },
      onPanResponderRelease: () => {
        const { strokes: s, onChange: change, color: c } = latest.current;
        if (current.current) change([...s, { d: current.current, color: c }]);
        current.current = '';
        setLive('');
      },
    }),
  ).current;

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents={enabled ? 'auto' : 'none'} {...(enabled ? responder.panHandlers : {})}>
      <Svg style={StyleSheet.absoluteFill} pointerEvents="none">
        {strokes.map((s, i) => (
          <Path key={i} d={s.d} stroke={s.color} strokeWidth={4} fill="none" strokeLinecap="round" strokeLinejoin="round" />
        ))}
        {live ? <Path d={live} stroke={color} strokeWidth={4} fill="none" strokeLinecap="round" strokeLinejoin="round" /> : null}
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  toolbar: { flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center', backgroundColor: colors.primary, paddingVertical: spacing.sm },
  tool: { padding: spacing.sm, borderRadius: 10 },
  toolOn: { backgroundColor: colors.white },
});
