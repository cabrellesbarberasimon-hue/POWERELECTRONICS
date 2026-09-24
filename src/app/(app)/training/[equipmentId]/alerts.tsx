import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useAlerts, useCourses, useEquipment, useResolveAlert } from '@/hooks/api';
import { useI18n } from '@/i18n';
import { allSteps } from '@/modules/university/progress';
import { EmptyState, GhostButton, Header, Loading, ParameterGrid, Screen, toast } from '@/shared/components';
import { useUser } from '@/stores/session';
import { colors, fonts, fontSize, radius, spacing } from '@/theme';
import type { Alert } from '@/types/domain';

/** Alerts (Figure 3.2): preventive / urgent maintenance with parameters, 3D and video. */
export default function Alerts() {
  const { equipmentId, part } = useLocalSearchParams<{ equipmentId: string; part?: string }>();
  const { t } = useI18n();
  const alerts = useAlerts(equipmentId);
  const equipment = useEquipment(equipmentId);
  if (!alerts.data || !equipment.data) return <Loading />;
  const list = part ? alerts.data.filter((a) => a.partId === part) : alerts.data;

  return (
    <Screen header={<Header title={t('assistance.alerts')} home={false} />}>
      {list.length === 0 && <EmptyState text={t('common.empty')} icon="checkmark-done-circle-outline" />}
      {list.map((a) => (
        <AlertCard key={a.id} alert={a} />
      ))}
    </Screen>
  );
}

function AlertCard({ alert }: { alert: Alert }) {
  const { t, tr, relative } = useI18n();
  const user = useUser();
  const resolve = useResolveAlert();
  const courses = useCourses();
  const urgent = alert.severity === 'urgent';
  const canResolve = user.role !== 'employee';

  const video = () => {
    for (const c of courses.data ?? []) {
      const step = allSteps(c).find((s) => s.partId === alert.partId && s.type === 'video') ?? allSteps(c).find((s) => s.partId === alert.partId);
      if (step) return router.push({ pathname: '/university/lesson/[courseId]/[stepId]', params: { courseId: c.id, stepId: step.id } });
    }
    toast(t('common.empty'));
  };

  return (
    <View style={[styles.card, alert.resolved && { opacity: 0.55 }]}>
      <View style={[styles.banner, { backgroundColor: urgent ? '#F8D7D7' : '#FFF1C2' }]}>
        <Ionicons name={urgent ? 'alert-circle' : 'warning'} size={20} color={urgent ? colors.red : '#B7791F'} />
        <Text style={[styles.bannerText, { color: urgent ? colors.red : '#8A5A00' }]}>{alert.resolved ? t('assistance.resolved') : tr(alert.title)}</Text>
      </View>
      <View style={{ padding: spacing.lg, gap: spacing.md }}>
        <Text style={styles.trigger}>/{tr(alert.trigger)}</Text>
        <View style={styles.desc}>
          <View style={[styles.dot, { backgroundColor: urgent ? colors.red : colors.yellow }]} />
          <Text style={styles.descText}>{tr(alert.description)}</Text>
        </View>
        <Text style={styles.meta}>{relative(alert.createdAt)}</Text>
        <Text style={styles.params}>{t('training.parameters')}</Text>
        <ParameterGrid params={alert.parameters} columns={3} />
        <View style={styles.buttons}>
          <Pressable style={styles.square} onPress={() => router.push({ pathname: '/training/[equipmentId]', params: { equipmentId: alert.equipmentId, part: alert.partId, tab: 'training' } })} accessibilityRole="button" accessibilityLabel={t('assistance.view3d')}>
            <Ionicons name="cube-outline" size={30} color={colors.primary} />
          </Pressable>
          <Pressable style={styles.square} onPress={video} accessibilityRole="button" accessibilityLabel={t('assistance.video')}>
            <Ionicons name="videocam" size={30} color={colors.primary} />
          </Pressable>
        </View>
        {canResolve && !alert.resolved && (
          <GhostButton label={t('assistance.resolve')} icon="checkmark-done" onPress={() => resolve.mutate(alert.id, { onSuccess: () => toast(t('assistance.resolved'), 'success') })} loading={resolve.isPending} />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: radius.lg, overflow: 'hidden', backgroundColor: colors.white, borderWidth: 1, borderColor: colors.border, marginBottom: spacing.lg },
  banner: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm, paddingVertical: spacing.md },
  bannerText: { fontFamily: fonts.semibold, fontSize: fontSize.md },
  trigger: { fontFamily: fonts.regular, fontSize: fontSize.md, color: colors.textMuted, borderBottomWidth: 1, borderColor: colors.border, paddingBottom: 4 },
  desc: { flexDirection: 'row', gap: spacing.sm, backgroundColor: '#E5E5E5', padding: spacing.md },
  dot: { width: 12, height: 12, borderRadius: 6, marginTop: 4 },
  descText: { flex: 1, fontFamily: fonts.regular, fontSize: fontSize.md, color: colors.text },
  meta: { fontFamily: fonts.regular, fontSize: fontSize.xs, color: colors.textMuted },
  params: { fontFamily: fonts.semibold, fontSize: fontSize.lg, color: colors.text, textAlign: 'center' },
  buttons: { flexDirection: 'row', justifyContent: 'center', gap: spacing.lg },
  square: { width: 64, height: 56, borderRadius: radius.lg, borderWidth: 2, borderColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
});
