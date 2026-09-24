import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { G as SvgGroup, Line, Path, Text as SvgText } from 'react-native-svg';
import { useI18n } from '@/i18n';
import { colors, fonts, radius, spacing } from '@/theme';
import type { ProjectionYear } from './licensing';

// Diverging pair validated with the dataviz palette validator (light surface).
const POS = '#1E88C4';
const NEG = '#D64545';
const BAR = 24;

/** Column path growing from the zero baseline: 4px rounded data-end, square at the baseline. */
function column(x: number, y0: number, y1: number) {
  const r = Math.min(4, Math.abs(y1 - y0));
  const w = BAR;
  if (y1 < y0) {
    return `M${x} ${y0} L${x} ${y1 + r} Q${x} ${y1} ${x + r} ${y1} L${x + w - r} ${y1} Q${x + w} ${y1} ${x + w} ${y1 + r} L${x + w} ${y0} Z`;
  }
  return `M${x} ${y0} L${x} ${y1 - r} Q${x} ${y1} ${x + r} ${y1} L${x + w - r} ${y1} Q${x + w} ${y1} ${x + w} ${y1 - r} L${x + w} ${y0} Z`;
}

/** Yearly profit (single series, one axis). Tap a column for the year's detail; the table below holds every value. */
export function ProfitChart({ rows, width }: { rows: ProjectionYear[]; width: number }) {
  const { t, formatEur } = useI18n();
  const [active, setActive] = useState<number | null>(null);
  const height = 170;
  const pad = { top: 18, bottom: 38, left: 8, right: 8 };
  const max = Math.max(...rows.map((r) => r.profit), 0);
  const min = Math.min(...rows.map((r) => r.profit), 0);
  const span = max - min || 1;
  const y = (v: number) => pad.top + ((max - v) / span) * (height - pad.top - pad.bottom);
  const band = (width - pad.left - pad.right) / rows.length;
  const zero = y(0);
  const extremes = new Set([rows.reduce((a, b) => (b.profit < a.profit ? b : a)).year, rows.reduce((a, b) => (b.profit > a.profit ? b : a)).year]);
  const sel = rows.find((r) => r.year === active);

  return (
    <View>
      <View style={styles.legend}>
        <View style={[styles.swatch, { backgroundColor: POS }]} />
        <Text style={styles.legendText}>{t('admin.profit')} ≥ 0</Text>
        <View style={[styles.swatch, { backgroundColor: NEG }]} />
        <Text style={styles.legendText}>{t('admin.profit')} &lt; 0</Text>
      </View>
      <View>
        <Svg width={width} height={height}>
          <Line x1={pad.left} x2={width - pad.right} y1={zero} y2={zero} stroke={colors.border} strokeWidth={1} />
          {rows.map((r, i) => {
            const x = pad.left + i * band + (band - BAR) / 2;
            const top = y(r.profit);
            const labelY = r.profit >= 0 ? top - 5 : top + 12;
            return (
              <SvgGroup key={r.year}>
                {r.profit !== 0 && <Path d={column(x, zero, top)} fill={r.profit >= 0 ? POS : NEG} opacity={active && active !== r.year ? 0.45 : 1} />}
                {extremes.has(r.year) && r.profit !== 0 && (
                  <SvgText x={x + BAR / 2} y={labelY} fontSize={10} fill={colors.text} textAnchor="middle" fontFamily={fonts.medium}>
                    {`${Math.round(r.profit / 1000)}k`}
                  </SvgText>
                )}
                <SvgText x={x + BAR / 2} y={height - 6} fontSize={10} fill={colors.textMuted} textAnchor="middle" fontFamily={fonts.regular}>
                  {`${t('admin.year').charAt(0)}${r.year}`}
                </SvgText>
              </SvgGroup>
            );
          })}
        </Svg>
        {/* Hit targets wider than the marks */}
        <View style={[StyleSheet.absoluteFill, { flexDirection: 'row', paddingHorizontal: pad.left }]}>
          {rows.map((r) => (
            <Pressable key={r.year} style={{ flex: 1 }} onPress={() => setActive(active === r.year ? null : r.year)} accessibilityRole="button" accessibilityLabel={`${t('admin.year')} ${r.year}: ${formatEur(r.profit)}`} />
          ))}
        </View>
      </View>
      {sel && (
        <View style={styles.tooltip}>
          <Text style={styles.tipTitle}>
            {t('admin.year')} {sel.year}
          </Text>
          <Text style={styles.tipText}>
            {t('admin.profit')}: {formatEur(sel.profit)} · {t('admin.cumulative')}: {formatEur(sel.cumulative)}
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  legend: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: spacing.sm },
  swatch: { width: 10, height: 10, borderRadius: 2 },
  legendText: { fontFamily: fonts.regular, fontSize: 11, color: colors.textMuted, marginRight: spacing.sm },
  tooltip: { backgroundColor: colors.navy, borderRadius: radius.sm, padding: spacing.sm, marginTop: spacing.sm },
  tipTitle: { color: colors.white, fontFamily: fonts.semibold, fontSize: 12 },
  tipText: { color: colors.white, fontFamily: fonts.regular, fontSize: 11 },
});
