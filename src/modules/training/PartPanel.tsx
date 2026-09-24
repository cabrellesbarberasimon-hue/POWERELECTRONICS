import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useI18n } from '@/i18n';
import { CheckBadge, ParameterGrid, ProgressRing } from '@/shared/components';
import { colors, fonts, fontSize, radius, spacing } from '@/theme';
import type { Equipment, EquipmentPart } from '@/types/domain';

const PART_ICON: Record<string, keyof typeof MaterialCommunityIcons.glyphMap> = {
  'p-fans': 'fan',
  'p-lever': 'toggle-switch-outline',
  'p-power-module': 'chip',
  'p-dc-fuses': 'fuse',
  'p-ac-breaker': 'electric-switch',
  'p-filter': 'flash-alert-outline',
  'p-aux': 'battery-charging',
  'p-control': 'monitor-dashboard',
};

/** Right-hand "TRAINING EXPERIENCE" panel from Figure 3.1. */
export function PartPanel({
  equipment,
  part,
  percent,
  done,
  onSelect,
  onClose,
}: {
  equipment: Equipment;
  part?: EquipmentPart;
  percent: number;
  done: boolean;
  onSelect: (p: EquipmentPart) => void;
  onClose: () => void;
}) {
  const { t, tr } = useI18n();
  const [q, setQ] = useState('');
  const parts = equipment.parts.filter((p) => !q.trim() || tr(p.name).toLowerCase().includes(q.trim().toLowerCase()));
  return (
    <View style={styles.panel}>
      <View style={styles.search}>
        <TextInput value={q} onChangeText={setQ} placeholder="" style={styles.searchInput} accessibilityLabel={t('common.search')} />
        <Ionicons name="search" size={16} color={colors.textMuted} />
      </View>
      <View style={styles.titleRow}>
        <Text style={styles.title}>{t('training.experience')}</Text>
        <Pressable onPress={onClose} hitSlop={10} accessibilityLabel={t('common.close')}>
          <Ionicons name="close" size={18} color={colors.textMuted} />
        </Pressable>
      </View>
      <Text style={styles.family}>/{equipment.family}</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.icons}>
        <Ionicons name="list" size={22} color={colors.primary} />
        {parts.map((p) => (
          <Pressable
            key={p.id}
            onPress={() => onSelect(p)}
            accessibilityLabel={tr(p.name)}
            style={[styles.icon, part?.id === p.id && styles.iconOn]}
          >
            <MaterialCommunityIcons name={PART_ICON[p.id] ?? 'cog'} size={22} color={part?.id === p.id ? colors.white : colors.primary} />
          </Pressable>
        ))}
      </ScrollView>
      <ScrollView contentContainerStyle={{ paddingBottom: spacing.lg }}>
        {part ? (
          <>
            <Text style={styles.partName}>{tr(part.name)}</Text>
            <View style={styles.status}>
              <ProgressRing percent={percent} size={46} stroke={5} />
              <CheckBadge size={42} done={done} />
            </View>
            <Text style={styles.params}>{t('training.parameters')}</Text>
            <ParameterGrid params={part.parameters} columns={2} small />
          </>
        ) : (
          <Text style={styles.hint}>{t('training.tapPart')}</Text>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  panel: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    width: 190,
    backgroundColor: '#EFEFEF',
    padding: spacing.md,
    borderTopLeftRadius: radius.lg,
    borderBottomLeftRadius: radius.lg,
    elevation: 8,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 10,
  },
  search: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.sm,
    height: 32,
    borderWidth: 1,
    borderColor: colors.border,
  },
  searchInput: { flex: 1, fontFamily: fonts.regular, fontSize: 12 },
  titleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: spacing.md },
  title: { fontFamily: fonts.semibold, fontSize: fontSize.sm, color: '#4B4B4B' },
  family: { fontFamily: fonts.regular, fontSize: fontSize.sm, color: colors.textMuted, marginTop: spacing.sm },
  icons: { gap: spacing.sm, alignItems: 'center', paddingVertical: spacing.sm },
  icon: { padding: 3, borderRadius: radius.sm },
  iconOn: { backgroundColor: colors.primary },
  partName: { fontFamily: fonts.semibold, fontSize: fontSize.md, color: '#4B4B4B', textAlign: 'center', marginTop: spacing.sm },
  status: { flexDirection: 'row', justifyContent: 'center', gap: spacing.md, marginVertical: spacing.md },
  params: { fontFamily: fonts.semibold, fontSize: fontSize.sm, color: '#4B4B4B', textAlign: 'center', marginBottom: spacing.sm },
  hint: { fontFamily: fonts.regular, fontSize: fontSize.xs, color: colors.textMuted, marginTop: spacing.lg, textAlign: 'center' },
});
