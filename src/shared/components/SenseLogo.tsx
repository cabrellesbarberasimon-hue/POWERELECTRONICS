import { StyleSheet, Text, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { colors, fonts } from '@/theme';

/** "SENSE" wordmark with the corner brackets from the splash mockup. */
export function SenseLogo({ color = colors.white, scale = 1, subtitle }: { color?: string; scale?: number; subtitle?: string }) {
  const w = 230 * scale;
  const h = 100 * scale;
  return (
    <View style={{ alignItems: 'center' }} accessible accessibilityLabel="SENSE by Power Electronics">
      <View style={{ width: w, height: h, alignItems: 'center', justifyContent: 'center', transform: [{ rotate: '-4deg' }] }}>
        <Svg width={w} height={h} viewBox="0 0 230 100" style={StyleSheet.absoluteFill}>
          {/* bottom-left bracket */}
          <Path d="M6 40 L10 90 L70 86" stroke={color} strokeWidth={9} strokeLinecap="round" strokeLinejoin="round" fill="none" />
          {/* top-right bracket */}
          <Path d="M160 12 L220 8 L224 58" stroke={color} strokeWidth={9} strokeLinecap="round" strokeLinejoin="round" fill="none" />
        </Svg>
        <Text style={{ color, fontFamily: fonts.bold, fontSize: 52 * scale, letterSpacing: 1, marginTop: 4 * scale }}>SENSE</Text>
      </View>
      {subtitle && <Text style={{ color, fontFamily: fonts.regular, fontSize: 18 * scale, marginTop: 10 * scale }}>{subtitle}</Text>}
    </View>
  );
}
