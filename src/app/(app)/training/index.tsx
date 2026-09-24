import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { useAlerts, useEquipmentList, useProcedures } from '@/hooks/api';
import { useI18n } from '@/i18n';
import { FreesunCabinet } from '@/modules/training/FreesunCabinet';
import { CTAButton, Card, Header, Loading, OutlineButton, Screen, SectionTitle } from '@/shared/components';
import { colors, fonts, fontSize, radius, spacing } from '@/theme';
import type { Equipment } from '@/types/domain';

/** Entry to Training Experience 4.0: scan an equipment/marker or open the demo. */
export default function TrainingHome() {
  const { t } = useI18n();
  const equipment = useEquipmentList();
  if (!equipment.data) return <Loading />;

  return (
    <Screen header={<Header title={t('training.title')} />}>
      <View style={styles.hero}>
        <MaterialCommunityIcons name="scan-helper" size={72} color={colors.primary} />
        <Text style={styles.heroText}>{t('training.selectEquipment')}</Text>
      </View>
      {equipment.data.map((e) => (
        <EquipmentCard key={e.id} equipment={e} />
      ))}
    </Screen>
  );
}

function EquipmentCard({ equipment }: { equipment: Equipment }) {
  const { t, tr } = useI18n();
  const alerts = useAlerts(equipment.id);
  const procedures = useProcedures(equipment.id);
  const open = alerts.data?.filter((a) => !a.resolved).length ?? 0;
  return (
    <Card style={{ gap: spacing.md }}>
      <View style={styles.preview}>
        <FreesunCabinet width={300} />
      </View>
      <View style={styles.row}>
        <Text style={styles.name}>{equipment.name}</Text>
        {open > 0 && (
          <View style={styles.alerts}>
            <Ionicons name="alert-circle" size={14} color={colors.white} />
            <Text style={styles.alertsText}>{t('assistance.openAlerts', { count: open })}</Text>
          </View>
        )}
      </View>
      <Text style={styles.meta}>{equipment.site}</Text>
      <Text style={styles.desc}>{tr(equipment.description)}</Text>
      <SectionTitle>{t('training.procedure')}</SectionTitle>
      {procedures.data?.map((p) => (
        <Text key={p.id} style={styles.proc}>
          • {tr(p.title)} ({p.steps.length})
        </Text>
      ))}
      <CTAButton
        testID="scan-equipment"
        icon="scan"
        label={t('training.scan')}
        onPress={() => router.push({ pathname: '/training/[equipmentId]', params: { equipmentId: equipment.id } })}
      />
      <OutlineButton
        testID="demo-equipment"
        icon="image-outline"
        label={t('training.demoMode')}
        onPress={() => router.push({ pathname: '/training/[equipmentId]', params: { equipmentId: equipment.id, demo: '1' } })}
      />
    </Card>
  );
}

const styles = StyleSheet.create({
  hero: { alignItems: 'center', gap: spacing.sm, marginBottom: spacing.xl },
  heroText: { fontFamily: fonts.medium, fontSize: fontSize.md, color: colors.textMuted },
  preview: {
    alignItems: 'center',
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    overflow: 'hidden',
  },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  name: { fontFamily: fonts.bold, fontSize: fontSize.xl, color: colors.navy },
  alerts: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.red,
    borderRadius: radius.pill,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  alertsText: { color: colors.white, fontFamily: fonts.semibold, fontSize: 11 },
  meta: { fontFamily: fonts.regular, fontSize: fontSize.xs, color: colors.textMuted, marginTop: -8 },
  desc: { fontFamily: fonts.regular, fontSize: fontSize.sm, color: colors.text },
  proc: { fontFamily: fonts.regular, fontSize: fontSize.sm, color: colors.text },
});
