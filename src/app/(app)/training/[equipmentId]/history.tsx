import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useEquipment, useHistory, useUsers } from '@/hooks/api';
import { useI18n } from '@/i18n';
import { Header, Loading, ParameterGrid, Screen } from '@/shared/components';
import { colors, fonts, fontSize, spacing } from '@/theme';
import type { Severity } from '@/types/domain';

const SEV: Record<Severity, string> = { urgent: colors.red, preventive: '#F5A623', info: colors.primary };

/** Technical History (Figure 3.2). Feeds the AI engine with repeated failures. */
export default function History() {
  const { equipmentId } = useLocalSearchParams<{ equipmentId: string }>();
  const { t, tr, formatDate } = useI18n();
  const history = useHistory(equipmentId);
  const equipment = useEquipment(equipmentId);
  const users = useUsers();
  const [open, setOpen] = useState<string | null>(null);
  if (!history.data || !equipment.data) return <Loading />;

  return (
    <Screen header={<Header title={t('assistance.history')} home={false} />} padded={false}>
      <Text style={styles.family}>{equipment.data.family}</Text>
      {history.data.map((h) => {
        const expanded = open === h.id;
        const tech = users.data?.find((u) => u.id === h.technicianId);
        const part = equipment.data!.parts.find((p) => p.id === h.partId);
        return (
          <Pressable
            key={h.id}
            onPress={() => setOpen(expanded ? null : h.id)}
            style={[styles.item, expanded && styles.itemOpen]}
            accessibilityRole="button"
            accessibilityState={{ expanded }}
          >
            <View style={styles.row}>
              <View style={[styles.dot, { backgroundColor: SEV[h.severity] }]}>
                <Text style={styles.dotText}>!</Text>
              </View>
              <Text style={styles.desc}>{tr(h.description)}</Text>
            </View>
            <Text style={styles.meta}>
              {part ? tr(part.name) : ''} · {tech?.name} · {formatDate(h.date)}
            </Text>
            {expanded && (
              <View style={{ marginTop: spacing.md, gap: spacing.sm }}>
                {h.parameters.length > 0 && <ParameterGrid params={[...h.parameters, ...h.parameters].slice(0, 6)} columns={3} />}
                <Text style={[styles.meta, { color: h.firstTimeFix ? colors.green : colors.red }]}>
                  {h.firstTimeFix ? `✓ ${t('assistance.firstTimeFix')}` : `↻ ${t('assistance.secondVisit')}`}
                </Text>
              </View>
            )}
            <Ionicons name={expanded ? 'chevron-up' : 'chevron-down'} size={16} color={SEV[h.severity]} style={{ alignSelf: 'center' }} />
          </Pressable>
        );
      })}
    </Screen>
  );
}

const styles = StyleSheet.create({
  family: {
    fontFamily: fonts.regular,
    fontSize: fontSize.md,
    color: colors.textMuted,
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderColor: colors.border,
  },
  item: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: 4,
    backgroundColor: '#EDEDED',
    borderBottomWidth: 2,
    borderColor: colors.white,
  },
  itemOpen: { backgroundColor: '#E2E2E2' },
  row: { flexDirection: 'row', gap: spacing.sm },
  dot: { width: 14, height: 14, borderRadius: 7, alignItems: 'center', justifyContent: 'center', marginTop: 4 },
  dotText: { color: colors.white, fontSize: 9, fontFamily: fonts.bold },
  desc: { flex: 1, fontFamily: fonts.regular, fontSize: fontSize.md, color: colors.text },
  meta: { fontFamily: fonts.regular, fontSize: fontSize.xs, color: colors.textMuted, marginLeft: 22, marginTop: 2 },
});
