import { useMemo, useRef, useState } from 'react';
import { PanResponder, View } from 'react-native';
import Svg, { Polygon } from 'react-native-svg';
import { colors } from '@/theme';

type Vec = [number, number, number];

interface Box {
  center: Vec;
  size: Vec;
  color: string;
}

/** Simplified power module: chassis, heatsink fins, capacitors and handle. */
const MODEL: Box[] = [
  { center: [0, 0, 0], size: [1.6, 1.0, 1.0], color: '#9AA5B1' },
  ...Array.from({ length: 6 }, (_, i): Box => ({ center: [-0.65 + i * 0.26, 0.62, 0], size: [0.08, 0.25, 0.95], color: '#6B7785' })),
  { center: [-0.45, -0.55, 0.25], size: [0.28, 0.1, 0.28], color: colors.primary },
  { center: [0.05, -0.55, 0.25], size: [0.28, 0.1, 0.28], color: colors.primary },
  { center: [0.55, -0.55, 0.25], size: [0.28, 0.1, 0.28], color: colors.primary },
  { center: [0, 0, 0.56], size: [0.9, 0.18, 0.1], color: colors.orange },
];

const FACES = [
  [0, 1, 2, 3],
  [4, 5, 6, 7],
  [0, 1, 5, 4],
  [2, 3, 7, 6],
  [1, 2, 6, 5],
  [0, 3, 7, 4],
];

function shade(hex: string, f: number) {
  const n = parseInt(hex.slice(1), 16);
  const r = Math.min(255, Math.round(((n >> 16) & 255) * f));
  const g = Math.min(255, Math.round(((n >> 8) & 255) * f));
  const b = Math.min(255, Math.round((n & 255) * f));
  return `rgb(${r},${g},${b})`;
}

/**
 * Tiny dependency-free 3D viewer (drag to rotate). Stands in for a real
 * glTF viewer (expo-gl + three.js) in the beta.
 */
export function Model3D({ size = 260 }: { size?: number }) {
  const [rot, setRot] = useState({ y: 0.6, x: -0.45 });
  const start = useRef(rot);
  const responder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        start.current = rotRef.current;
      },
      onPanResponderMove: (_, g) => setRot({ y: start.current.y + g.dx / 90, x: Math.max(-1.3, Math.min(1.3, start.current.x - g.dy / 90)) }),
    }),
  ).current;
  const rotRef = useRef(rot);
  rotRef.current = rot;

  const polys = useMemo(() => {
    const cy = Math.cos(rot.y);
    const sy = Math.sin(rot.y);
    const cx = Math.cos(rot.x);
    const sx = Math.sin(rot.x);
    const project = ([x, y, z]: Vec) => {
      const x1 = x * cy + z * sy;
      const z1 = -x * sy + z * cy;
      const y2 = y * cx - z1 * sx;
      const z2 = y * sx + z1 * cx;
      const scale = size * 0.32;
      return { x: size / 2 + x1 * scale, y: size / 2 + y2 * scale, z: z2 };
    };
    const out: { pts: string; z: number; fill: string }[] = [];
    for (const b of MODEL) {
      const [w, h, d] = b.size.map((s) => s / 2);
      const [ox, oy, oz] = b.center;
      const verts: Vec[] = [
        [ox - w, oy - h, oz - d],
        [ox + w, oy - h, oz - d],
        [ox + w, oy + h, oz - d],
        [ox - w, oy + h, oz - d],
        [ox - w, oy - h, oz + d],
        [ox + w, oy - h, oz + d],
        [ox + w, oy + h, oz + d],
        [ox - w, oy + h, oz + d],
      ].map((v) => v as Vec);
      const p = verts.map(project);
      FACES.forEach((f, i) => {
        const z = f.reduce((a, k) => a + p[k].z, 0) / 4;
        out.push({ pts: f.map((k) => `${p[k].x},${p[k].y}`).join(' '), z, fill: shade(b.color, 0.75 + (i % 3) * 0.15) });
      });
    }
    return out.sort((a, b) => a.z - b.z);
  }, [rot, size]);

  return (
    <View {...responder.panHandlers} style={{ width: size, height: size, alignSelf: 'center' }} accessibilityLabel="3D model">
      <Svg width={size} height={size}>
        {polys.map((p, i) => (
          <Polygon key={i} points={p.pts} fill={p.fill} stroke="rgba(0,0,0,0.25)" strokeWidth={0.6} />
        ))}
      </Svg>
    </View>
  );
}
