import { Ionicons } from '@expo/vector-icons';
import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import type { Parameter, User } from '@/types/domain';
import { colors, fonts, fontSize, radius, shadow, spacing } from '@/theme';

/** Circular progress indicator ("0%", "5%" in the mockups). */
export function ProgressRing({ percent, size = 44, stroke = 5, color = colors.primary, label = true }: { percent: number; size?: number; stroke?: number; color?: string; label?: boolean }) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const p = Math.max(0, Math.min(100, percent));
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }} accessibilityLabel={`${p}%`}>
      <Svg width={size} height={size} style={StyleSheet.absoluteFill}>
        <Circle cx={size / 2} cy={size / 2} r={r} stroke="#3A3A3A" strokeOpacity={0.85} strokeWidth={stroke} fill="none" />
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={color}
          strokeWidth={stroke}
          fill="none"
          strokeDasharray={`${(p / 100) * c} ${c}`}
          strokeLinecap="round"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </Svg>
      {label && <Text style={{ fontFamily: fonts.semibold, fontSize: size * 0.26, color: colors.text }}>{p}%</Text>}
    </View>
  );
}

export function LinearProgress({ percent, color = colors.primary, height = 6 }: { percent: number; color?: string; height?: number }) {
  return (
    <View style={{ height, borderRadius: height, backgroundColor: colors.border, overflow: 'hidden' }}>
      <View style={{ width: `${Math.max(0, Math.min(100, percent))}%`, height, backgroundColor: color }} />
    </View>
  );
}

/** Green circle check used for completed steps. */
export function CheckBadge({ size = 36, done = true, onPress }: { size?: number; done?: boolean; onPress?: () => void }) {
  const inner = (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: done ? colors.green : colors.white,
        borderWidth: done ? 0 : 2,
        borderColor: colors.green,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Ionicons name="checkmark" size={size * 0.62} color={done ? colors.white : colors.green} />
    </View>
  );
  return onPress ? (
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel="complete">
      {inner}
    </Pressable>
  ) : (
    inner
  );
}

/** "18w / POWER" tile from the Parameters card. */
export function ParameterTile({ p, small }: { p: Parameter; small?: boolean }) {
  return (
    <View style={[styles.param, small && styles.paramSmall]}>
      <Text style={[styles.paramValue, small && { fontSize: fontSize.lg }]} numberOfLines={1} adjustsFontSizeToFit>
        {p.value}
      </Text>
      <Text style={styles.paramLabel}>{p.label}</Text>
    </View>
  );
}

export function ParameterGrid({ params, columns = 3, small }: { params: Parameter[]; columns?: number; small?: boolean }) {
  return (
    <View style={styles.grid}>
      {params.map((p, i) => (
        <View key={`${p.label}-${i}`} style={{ width: `${100 / columns}%`, padding: 4 }}>
          <ParameterTile p={p} small={small} />
        </View>
      ))}
    </View>
  );
}

export function Avatar({ user, size = 40, ring }: { user?: Pick<User, 'name' | 'avatarColor' | 'online'>; size?: number; ring?: boolean }) {
  const initials = (user?.name ?? '?')
    .split(' ')
    .map((s) => s[0])
    .slice(0, 2)
    .join('');
  return (
    <View>
      <View
        style={{
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: user?.avatarColor ?? colors.primary,
          alignItems: 'center',
          justifyContent: 'center',
          borderWidth: ring ? 2 : 0,
          borderColor: colors.white,
        }}
      >
        <Text style={{ color: colors.white, fontFamily: fonts.semibold, fontSize: size * 0.38 }}>{initials}</Text>
      </View>
      {user?.online !== undefined && size >= 32 && (
        <View
          style={{
            position: 'absolute',
            right: 0,
            bottom: 0,
            width: size * 0.28,
            height: size * 0.28,
            borderRadius: size,
            backgroundColor: user.online ? colors.green : '#9CA3AF',
            borderWidth: 2,
            borderColor: colors.white,
          }}
        />
      )}
    </View>
  );
}

/** Rounded grey module card with a blue circle icon (home screen / levels). */
export function ModuleCard({
  label,
  icon,
  onPress,
  style,
  footer,
  disabled,
  testID,
}: {
  label: string;
  icon: ReactNode;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
  footer?: ReactNode;
  disabled?: boolean;
  testID?: string;
}) {
  return (
    <Pressable
      testID={testID}
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={label.replace(/\n/g, ' ')}
      style={({ pressed }) => [styles.module, pressed && { opacity: 0.85 }, disabled && { opacity: 0.55 }, style]}
    >
      <View style={styles.moduleIcon}>{icon}</View>
      <Text style={styles.moduleLabel}>{label}</Text>
      {footer}
    </Pressable>
  );
}

export function Card({ children, style, onPress }: { children: ReactNode; style?: StyleProp<ViewStyle>; onPress?: () => void }) {
  if (onPress)
    return (
      <Pressable onPress={onPress} style={({ pressed }) => [styles.card, pressed && { opacity: 0.9 }, style]}>
        {children}
      </Pressable>
    );
  return <View style={[styles.card, style]}>{children}</View>;
}

export function Chip({ label, active, onPress, icon }: { label: string; active?: boolean; onPress?: () => void; icon?: keyof typeof Ionicons.glyphMap }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected: !!active }}
      style={[styles.chip, active && { backgroundColor: colors.primary, borderColor: colors.primary }]}
    >
      {icon && <Ionicons name={icon} size={14} color={active ? colors.white : colors.primary} />}
      <Text style={[styles.chipText, active && { color: colors.white }]}>{label}</Text>
    </Pressable>
  );
}

export function Stars({ value, size = 18, onChange }: { value: number; size?: number; onChange?: (v: 1 | 2 | 3 | 4 | 5) => void }) {
  return (
    <View style={{ flexDirection: 'row', gap: 2 }} accessibilityLabel={`${value} stars`}>
      {([1, 2, 3, 4, 5] as const).map((i) => (
        <Pressable key={i} disabled={!onChange} onPress={() => onChange?.(i)} hitSlop={4} accessibilityRole={onChange ? 'button' : undefined}>
          <Ionicons name={i <= Math.round(value) ? 'star' : 'star-outline'} size={size} color={colors.yellow} />
        </Pressable>
      ))}
    </View>
  );
}

export function EmptyState({ text, icon = 'sparkles-outline' }: { text: string; icon?: keyof typeof Ionicons.glyphMap }) {
  return (
    <View style={styles.empty}>
      <Ionicons name={icon} size={36} color={colors.primary} />
      <Text style={styles.emptyText}>{text}</Text>
    </View>
  );
}

export function SectionTitle({ children, right }: { children: ReactNode; right?: ReactNode }) {
  return (
    <View style={styles.sectionTitle}>
      <Text style={styles.sectionTitleText}>{children}</Text>
      {right}
    </View>
  );
}

/** Blue circle with a white icon, as used across the mockups. */
export function IconCircle({ icon, size = 56, color = colors.primary, iconColor = colors.white }: { icon: keyof typeof Ionicons.glyphMap; size?: number; color?: string; iconColor?: string }) {
  return (
    <View style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: color, alignItems: 'center', justifyContent: 'center' }}>
      <Ionicons name={icon} size={size * 0.5} color={iconColor} />
    </View>
  );
}

const styles = StyleSheet.create({
  param: {
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    paddingVertical: spacing.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    ...shadow.card,
  },
  paramSmall: { paddingVertical: spacing.sm },
  paramValue: { fontFamily: fonts.bold, fontSize: fontSize.xl, color: colors.text },
  paramLabel: { fontFamily: fonts.medium, fontSize: 9, color: colors.primary, letterSpacing: 0.5 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -4 },
  module: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
  },
  moduleIcon: { alignItems: 'center', justifyContent: 'center' },
  moduleLabel: { fontFamily: fonts.semibold, fontSize: fontSize.lg, color: '#3F3F46', textAlign: 'center', letterSpacing: 0.3 },
  card: { backgroundColor: colors.white, borderRadius: radius.lg, padding: spacing.lg, ...shadow.card },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.white,
  },
  chipText: { fontFamily: fonts.medium, fontSize: fontSize.sm, color: colors.text },
  empty: { alignItems: 'center', padding: spacing.xxl, gap: spacing.md },
  emptyText: { fontFamily: fonts.regular, fontSize: fontSize.md, color: colors.textMuted, textAlign: 'center' },
  sectionTitle: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: spacing.xl, marginBottom: spacing.sm },
  sectionTitleText: { fontFamily: fonts.semibold, fontSize: fontSize.lg, color: colors.text },
});
