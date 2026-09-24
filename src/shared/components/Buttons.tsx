import { Ionicons } from '@expo/vector-icons';
import { ActivityIndicator, Pressable, StyleSheet, Text, type StyleProp, type ViewStyle } from 'react-native';
import { colors, fonts, fontSize, radius, spacing } from '@/theme';

interface ButtonProps {
  label: string;
  onPress?: () => void;
  icon?: keyof typeof Ionicons.glyphMap;
  iconRight?: keyof typeof Ionicons.glyphMap;
  disabled?: boolean;
  loading?: boolean;
  style?: StyleProp<ViewStyle>;
  compact?: boolean;
  testID?: string;
}

type Kind = 'cta' | 'navy' | 'primary' | 'outline' | 'ghost' | 'danger';

function Base({ kind, label, onPress, icon, iconRight, disabled, loading, style, compact, testID }: ButtonProps & { kind: Kind }) {
  const s = kinds[kind];
  return (
    <Pressable
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel={label.replace(/\n/g, ' ')}
      onPress={onPress}
      disabled={disabled || loading}
      style={({ pressed }) => [
        styles.base,
        compact && styles.compact,
        s.container,
        (pressed || disabled) && { opacity: disabled ? 0.45 : 0.85 },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={s.text.color} />
      ) : (
        <>
          {icon && <Ionicons name={icon} size={18} color={s.text.color} style={{ marginRight: 6 }} />}
          <Text style={[styles.text, compact && styles.textCompact, s.text]} numberOfLines={2}>
            {label}
          </Text>
          {iconRight && <Ionicons name={iconRight} size={16} color={s.text.color} style={{ marginLeft: 4 }} />}
        </>
      )}
    </Pressable>
  );
}

/** Orange call to action, e.g. "TRAINING EXPERIENCE". */
export const CTAButton = (p: ButtonProps) => <Base kind="cta" {...p} />;
/** Navy button used by the login screen. */
export const NavyButton = (p: ButtonProps) => <Base kind="navy" {...p} />;
export const PrimaryButton = (p: ButtonProps) => <Base kind="primary" {...p} />;
/** Blue outlined pill, e.g. "Start >". */
export const OutlineButton = (p: ButtonProps) => <Base kind="outline" {...p} />;
export const GhostButton = (p: ButtonProps) => <Base kind="ghost" {...p} />;
export const DangerButton = (p: ButtonProps) => <Base kind="danger" {...p} />;

const styles = StyleSheet.create({
  base: {
    minHeight: 48,
    paddingHorizontal: spacing.xl,
    borderRadius: radius.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  compact: { minHeight: 36, paddingHorizontal: spacing.lg, borderRadius: radius.md },
  text: { fontFamily: fonts.semibold, fontSize: fontSize.md, textAlign: 'center' },
  textCompact: { fontSize: fontSize.sm },
});

const kinds: Record<Kind, { container: ViewStyle; text: { color: string } }> = {
  cta: { container: { backgroundColor: colors.orange }, text: { color: colors.white } },
  navy: { container: { backgroundColor: colors.navy, borderRadius: radius.sm }, text: { color: colors.white } },
  primary: { container: { backgroundColor: colors.primary }, text: { color: colors.white } },
  outline: { container: { borderWidth: 2, borderColor: colors.primary, backgroundColor: colors.white }, text: { color: colors.primary } },
  ghost: { container: { backgroundColor: 'transparent' }, text: { color: colors.primary } },
  danger: { container: { backgroundColor: colors.red }, text: { color: colors.white } },
};
