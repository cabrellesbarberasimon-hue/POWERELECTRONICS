import { StyleSheet } from 'react-native';
import Svg, { Defs, G, LinearGradient, Path, Polygon, Rect, Stop } from 'react-native-svg';

/** Demo background (no camera): PV plant with solar panels, as in Figure 2. */
export function SolarScene() {
  const panels = [0, 1, 2, 3];
  return (
    <Svg style={StyleSheet.absoluteFill} viewBox="0 0 360 640" preserveAspectRatio="xMidYMid slice">
      <Defs>
        <LinearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#6FA8D6" />
          <Stop offset="0.55" stopColor="#CFE3F2" />
          <Stop offset="1" stopColor="#E9EEF2" />
        </LinearGradient>
        <LinearGradient id="panel" x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0" stopColor="#1F3B64" />
          <Stop offset="1" stopColor="#0E2242" />
        </LinearGradient>
      </Defs>
      <Rect x={0} y={0} width={360} height={640} fill="url(#sky)" />
      <Path d="M0 300 L60 250 L120 285 L190 230 L260 280 L320 250 L360 270 L360 360 L0 360 Z" fill="#7C8F6B" opacity={0.8} />
      <Path d="M0 330 L80 300 L170 320 L260 295 L360 320 L360 380 L0 380 Z" fill="#9AA77F" />
      <Rect x={0} y={370} width={360} height={270} fill="#B9A98A" />
      {panels.map((i) => (
        <G key={i} transform={`translate(${150 + i * 8} ${170 + i * 95})`}>
          <Polygon points="0,0 230,-30 250,110 20,150" fill="url(#panel)" stroke="#C9D3DD" strokeWidth={3} />
          {Array.from({ length: 5 }, (_, k) => (
            <Path key={`v${k}`} d={`M${(k + 1) * 38} ${-5 * (k + 1)} L${(k + 1) * 38 + 16} ${150 - 25 * ((k + 1) / 6)}`} stroke="#8EA3BA" strokeWidth={1} opacity={0.6} />
          ))}
          {Array.from({ length: 3 }, (_, k) => (
            <Path key={`h${k}`} d={`M${5 * (k + 1)} ${37 * (k + 1)} L${235 + 4 * (k + 1)} ${-30 + 35 * (k + 1)}`} stroke="#8EA3BA" strokeWidth={1} opacity={0.6} />
          ))}
          <Rect x={110} y={140} width={6} height={60} fill="#7D8792" />
        </G>
      ))}
    </Svg>
  );
}
