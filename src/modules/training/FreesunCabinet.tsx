import Svg, { Circle, Defs, G, LinearGradient, Rect, Stop, Text as SvgText } from 'react-native-svg';

export const CABINET_RATIO = 400 / 220;

/**
 * Stylised Freesun HEMK cabinet (as in Figures 1, 3.1 and 3.2): louvred roof,
 * three string panels with DC levers, control section with pilot lights.
 */
export function FreesunCabinet({ width }: { width: number }) {
  const height = width / CABINET_RATIO;
  const panelX = [14, 88, 162];
  const levers: [string, string][] = [
    ['#2DBE4E', '#2DBE4E'],
    ['#E5333B', '#E5333B'],
    ['#2DBE4E', '#2DBE4E'],
  ];
  return (
    <Svg width={width} height={height} viewBox="0 0 400 220">
      <Defs>
        <LinearGradient id="body" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#F7F8FA" />
          <Stop offset="1" stopColor="#E3E6EA" />
        </LinearGradient>
      </Defs>
      {/* body */}
      <Rect x={4} y={4} width={392} height={200} rx={3} fill="url(#body)" stroke="#C4C9CF" strokeWidth={1.5} />
      {/* roof louvres */}
      <Rect x={4} y={4} width={392} height={22} fill="#DDE1E6" />
      {[14, 88, 162, 250, 320].map((x) => (
        <G key={x}>
          {[8, 12, 16, 20].map((y) => (
            <Rect key={y} x={x} y={y} width={62} height={2} fill="#9AA1A9" />
          ))}
        </G>
      ))}
      {/* string panels */}
      {panelX.map((x, i) => (
        <G key={x}>
          <Rect x={x} y={30} width={68} height={80} rx={2} fill="#FBFBFC" stroke="#BFC5CC" />
          <Rect x={x + 16} y={34} width={9} height={22} rx={2} fill={levers[i][0]} />
          <Rect x={x + 30} y={34} width={9} height={22} rx={2} fill={levers[i][1]} />
          <Rect x={x + 50} y={36} width={10} height={14} fill="#D0D4D9" />
          <Rect x={x + 8} y={62} width={52} height={8} fill="#E6A23C" />
          <Rect x={x + 22} y={92} width={24} height={4} fill="#2DBE4E" />
          <Rect x={x} y={114} width={68} height={82} rx={2} fill="#F3F4F6" stroke="#BFC5CC" />
          {[130, 180].map((y) => (
            <Circle key={y} cx={x + 6} cy={y} r={1.6} fill="#9AA1A9" />
          ))}
        </G>
      ))}
      {/* lower connection box of panel 3 */}
      <Rect x={176} y={176} width={40} height={10} fill="#9AA1A9" />
      {/* control section */}
      <Rect x={238} y={30} width={154} height={80} fill="#F7F8FA" stroke="#C4C9CF" />
      <Circle cx={300} cy={48} r={3.5} fill="#2DBE4E" />
      <Circle cx={312} cy={48} r={3.5} fill="#E5333B" />
      <Circle cx={324} cy={48} r={3.5} fill="#E5333B" />
      <Rect x={290} y={58} width={44} height={3} fill="#9AA1A9" />
      <Rect x={250} y={80} width={16} height={12} rx={2} fill="#1E3A8A" />
      <SvgText x={270} y={89} fontSize={6} fill="#1E3A8A" fontWeight="bold">
        POWER ELECTRONICS
      </SvgText>
      <Rect x={238} y={114} width={154} height={82} fill="#F3F4F6" stroke="#C4C9CF" />
      {/* plinth */}
      <Rect x={4} y={198} width={392} height={12} fill="#B8BEC5" />
      {[30, 110, 190, 270, 350].map((x) => (
        <Circle key={x} cx={x} cy={204} r={2} fill="#6B7280" />
      ))}
    </Svg>
  );
}
