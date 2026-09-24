import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useMemo, useRef, useState } from 'react';
import { Pressable, Share, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { useAlerts, useEquipment, useProcedures, useSaveSession } from '@/hooks/api';
import { useI18n } from '@/i18n';
import { ARView } from '@/modules/training/ARView';
import { PartPanel } from '@/modules/training/PartPanel';
import {
  AnnotationToolbar,
  CTAButton,
  CheckBadge,
  Chip,
  Loading,
  ProgressRing,
  toast,
  type AnnotationTool,
  type CameraBackdropHandle,
  type Stroke,
} from '@/shared/components';
import { useUser } from '@/stores/session';
import { colors, fonts, fontSize, radius, spacing } from '@/theme';
import type { EquipmentPart, TrainingSession } from '@/types/domain';

type Tab = 'training' | 'assistance';
type Mode = 'step' | 'free' | null;

/** Training View (Figure 3.1) and Assistance View (Figure 3.2) over the AR scene. */
export default function TrainingScreen() {
  const {
    equipmentId,
    demo,
    part: initialPart,
    tab: initialTab,
  } = useLocalSearchParams<{ equipmentId: string; demo?: string; part?: string; tab?: Tab }>();
  const { t, tr } = useI18n();
  const insets = useSafeAreaInsets();
  const user = useUser();
  const equipment = useEquipment(equipmentId);
  const procedures = useProcedures(equipmentId);
  const alerts = useAlerts(equipmentId);
  const saveSession = useSaveSession();
  const cam = useRef<CameraBackdropHandle>(null);

  const [tab, setTab] = useState<Tab>(initialTab ?? (user.role === 'sat' ? 'assistance' : 'training'));
  const [mode, setMode] = useState<Mode>(initialPart ? 'free' : null);
  const [procedureId, setProcedureId] = useState('proc-pm-replace');
  const [stepIdx, setStepIdx] = useState(0);
  const [selectedId, setSelectedId] = useState<string | undefined>(initialPart);
  const [panel, setPanel] = useState(!!initialPart);
  const [tool, setTool] = useState<AnnotationTool>('pointer');
  const [strokes, setStrokes] = useState<Stroke[]>([]);
  const [session, setSession] = useState<TrainingSession | null>(null);

  const procedure = procedures.data?.find((p) => p.id === procedureId) ?? procedures.data?.[0];
  const current = mode === 'step' ? procedure?.steps[stepIdx] : undefined;
  const openAlerts = useMemo(() => (alerts.data ?? []).filter((a) => !a.resolved), [alerts.data]);

  if (!equipment.data || !procedures.data) return <Loading />;
  const eq = equipment.data;
  const selected = eq.parts.find((p) => p.id === selectedId);

  const startMode = (m: Exclude<Mode, null>) => {
    setMode(m);
    setStepIdx(0);
    setSelectedId(undefined);
    setPanel(m === 'free');
    const s: TrainingSession = {
      id: `ts-${Date.now()}`,
      userId: user.id,
      equipmentId: eq.id,
      procedureId: m === 'step' ? procedure?.id : undefined,
      mode: m,
      completedStepIds: [],
      inspectedPartIds: [],
      startedAt: new Date().toISOString(),
    };
    setSession(s);
    saveSession.mutate(s);
  };

  const onPart = (p: EquipmentPart) => {
    Haptics.selectionAsync().catch(() => undefined);
    if (tab === 'assistance') {
      router.push({ pathname: '/training/[equipmentId]/alerts', params: { equipmentId: eq.id, part: p.id } });
      return;
    }
    if (mode === 'step' && current && p.id !== current.partId) {
      toast(t('training.wrongPart'), 'error');
      return;
    }
    setSelectedId(p.id);
    if (mode === 'free' && session) {
      const next = { ...session, inspectedPartIds: [...new Set([...session.inspectedPartIds, p.id])] };
      setSession(next);
      saveSession.mutate(next);
    }
    if (mode !== 'step') setPanel(true);
  };

  const completeStep = () => {
    if (!current || !procedure || !session) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => undefined);
    const last = stepIdx >= procedure.steps.length - 1;
    const next: TrainingSession = {
      ...session,
      completedStepIds: [...session.completedStepIds, current.id],
      finishedAt: last ? new Date().toISOString() : undefined,
    };
    setSession(next);
    saveSession.mutate(next);
    if (last) {
      toast(t('training.trainingDone'), 'success');
      setMode(null);
    } else {
      setStepIdx(stepIdx + 1);
      setSelectedId(undefined);
    }
  };

  const onTool = async (k: AnnotationTool) => {
    if (k === 'capture') {
      await cam.current?.capture();
      toast(t('training.captured'), 'success');
      return;
    }
    if (k === 'share') {
      Share.share({ message: `SENSE · ${eq.name} · ${selected ? tr(selected.name) : ''}` }).catch(() => undefined);
      return;
    }
    if (k === 'pen' && tool === 'pen') setStrokes([]);
    setTool(k);
    if (k === 'rotate') toast(t('training.rotate3d'));
  };

  const hotspots =
    tab === 'assistance'
      ? openAlerts.map((a) => ({ partId: a.partId, color: a.severity === 'urgent' ? colors.red : colors.yellow, pulse: true }))
      : mode === 'step' && current
        ? eq.parts.map((p) => ({ partId: p.id, pulse: p.id === current.partId, dim: p.id !== current.partId }))
        : eq.parts.map((p) => ({ partId: p.id }));

  const percent =
    mode === 'step' && procedure
      ? Math.round(((session?.completedStepIds.length ?? 0) / procedure.steps.length) * 100)
      : Math.round(((session?.inspectedPartIds.length ?? 0) / eq.parts.length) * 100);
  const currentPart = current && eq.parts.find((p) => p.id === current.partId);

  return (
    <View style={{ flex: 1, backgroundColor: colors.white }}>
      {/* Training | Assistance tabs */}
      <View style={[styles.tabs, { paddingTop: insets.top }]}>
        <Pressable
          style={[styles.tab, tab === 'training' ? styles.tabOn : styles.tabOff]}
          onPress={() => setTab('training')}
          accessibilityRole="tab"
          accessibilityState={{ selected: tab === 'training' }}
        >
          <Pressable onPress={() => router.dismissTo('/home')} hitSlop={8} accessibilityLabel="Home">
            <Ionicons name="home" size={20} color={colors.white} />
          </Pressable>
          <Text style={styles.tabText}>{t('training.training')}</Text>
        </Pressable>
        <Pressable
          testID="tab-assistance"
          style={[styles.tab, tab === 'assistance' ? styles.tabOn : styles.tabOff]}
          onPress={() => setTab('assistance')}
          accessibilityRole="tab"
          accessibilityState={{ selected: tab === 'assistance' }}
        >
          <MaterialCommunityIcons name="account-tie-voice" size={20} color={colors.white} />
          <Text style={styles.tabText}>{t('training.assistance')}</Text>
        </Pressable>
      </View>
      <View style={styles.sub}>
        <Text style={styles.subText}>{tab === 'training' ? eq.name : eq.family}</Text>
        {tab === 'assistance' && (
          <View style={styles.subIcons}>
            <Pressable
              onPress={() => router.push({ pathname: '/training/[equipmentId]/alerts', params: { equipmentId: eq.id } })}
              accessibilityLabel={t('assistance.alerts')}
              hitSlop={6}
            >
              <Ionicons name="information-circle" size={20} color={colors.white} />
            </Pressable>
            <Pressable testID="open-call" onPress={() => router.push('/call')} accessibilityLabel={t('assistance.call')} hitSlop={6}>
              <MaterialCommunityIcons name="headset" size={20} color={colors.white} />
            </Pressable>
          </View>
        )}
      </View>

      <View style={{ flex: 1 }}>
        <ARView
          equipment={eq}
          hotspots={hotspots}
          onPartPress={onPart}
          selectedPartId={selected?.id}
          drawing={tool === 'pen'}
          strokes={strokes}
          onStrokes={setStrokes}
          rotate3d={tool === 'rotate'}
          demo={demo === '1'}
          cameraRef={cam}
        />

        {tab === 'assistance' && (
          <View style={styles.quick}>
            <QuickAction
              icon="alert-circle"
              color={colors.red}
              label={t('assistance.alerts')}
              badge={openAlerts.length}
              onPress={() => router.push({ pathname: '/training/[equipmentId]/alerts', params: { equipmentId: eq.id } })}
              testID="qa-alerts"
            />
            <QuickAction
              icon="time"
              label={t('assistance.history')}
              onPress={() => router.push({ pathname: '/training/[equipmentId]/history', params: { equipmentId: eq.id } })}
              testID="qa-history"
            />
            <QuickAction
              icon="people"
              label={t('assistance.notifications')}
              onPress={() => router.push({ pathname: '/training/[equipmentId]/notifications', params: { equipmentId: eq.id } })}
              testID="qa-notifications"
            />
            <QuickAction
              icon="videocam"
              color={colors.green}
              label={t('assistance.call')}
              onPress={() => router.push('/call')}
              testID="qa-call"
            />
          </View>
        )}

        {tab === 'training' && !mode && (
          <View style={styles.modeBox}>
            <Text style={styles.modeHint}>{t('training.chooseMode')}</Text>
            <View style={styles.chips}>
              {procedures.data.map((p) => (
                <Chip key={p.id} label={tr(p.title)} active={p.id === procedure?.id} onPress={() => setProcedureId(p.id)} />
              ))}
            </View>
            <View style={styles.modes}>
              <CTAButton testID="mode-step" label={t('training.stepByStep')} onPress={() => startMode('step')} style={styles.modeBtn} />
              <CTAButton testID="mode-free" label={t('training.freeSelection')} onPress={() => startMode('free')} style={styles.modeBtn} />
            </View>
          </View>
        )}

        {tab === 'training' && mode === 'step' && current && procedure && (
          <View style={styles.stepCard}>
            <View style={styles.stepBar}>
              <Text style={styles.stepBarText}>{eq.family}</Text>
              <Text style={styles.stepCount}>{t('training.stepOf', { current: stepIdx + 1, total: procedure.steps.length })}</Text>
            </View>
            <View style={styles.stepBody}>
              <View style={{ flex: 1 }}>
                <Text style={styles.partName}>{currentPart ? tr(currentPart.name) : ''}</Text>
                <Text style={styles.instruction}>
                  <Text style={{ fontFamily: fonts.bold }}>{stepIdx + 1}. </Text>
                  {tr(current.instruction)}
                </Text>
                {selected?.id !== current.partId && <Text style={styles.tapHint}>👆 {t('training.tapPart')}</Text>}
              </View>
              <View style={{ alignItems: 'center', gap: 6 }}>
                <ProgressRing percent={percent} size={40} stroke={4} />
                <CheckBadge
                  size={44}
                  done={false}
                  onPress={selected?.id === current.partId ? completeStep : () => toast(t('training.tapPart'))}
                />
              </View>
            </View>
          </View>
        )}

        {tab === 'training' && mode && (
          <Pressable
            style={styles.exit}
            onPress={() => {
              setMode(null);
              setPanel(false);
            }}
            accessibilityRole="button"
            accessibilityLabel={t('training.exit')}
          >
            <Ionicons name="close" size={16} color={colors.white} />
            <Text style={styles.exitText}>{t('training.exit')}</Text>
          </Pressable>
        )}

        {tab === 'training' && !panel && (
          <Pressable
            style={styles.handle}
            onPress={() => setPanel(true)}
            accessibilityRole="button"
            accessibilityLabel={t('training.experience')}
          />
        )}
        {tab === 'training' && panel && (
          <PartPanel
            equipment={eq}
            part={selected}
            percent={percent}
            done={!!selected && !!session?.inspectedPartIds.includes(selected.id)}
            onSelect={onPart}
            onClose={() => setPanel(false)}
          />
        )}
      </View>

      <View style={{ paddingBottom: insets.bottom, backgroundColor: colors.primary }}>
        <AnnotationToolbar
          active={tool}
          onPress={onTool}
          labels={t('training.tools', { returnObjects: true }) as Record<AnnotationTool, string>}
        />
      </View>
    </View>
  );
}

function QuickAction({
  icon,
  label,
  onPress,
  color = colors.primary,
  badge,
  testID,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
  color?: string;
  badge?: number;
  testID?: string;
}) {
  return (
    <Pressable style={styles.qa} onPress={onPress} accessibilityRole="button" accessibilityLabel={label} testID={testID}>
      <View style={[styles.qaIcon, { backgroundColor: color }]}>
        <Ionicons name={icon} size={20} color={colors.white} />
        {!!badge && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{badge}</Text>
          </View>
        )}
      </View>
      <Text style={styles.qaText} numberOfLines={2}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  tabs: { flexDirection: 'row', backgroundColor: colors.darkTab },
  tab: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm, paddingVertical: spacing.md },
  tabOn: { backgroundColor: colors.primary },
  tabOff: { backgroundColor: colors.darkTab },
  tabText: { color: colors.white, fontFamily: fonts.semibold, fontSize: fontSize.md },
  sub: {
    backgroundColor: colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    borderTopWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  subText: { color: colors.white, fontFamily: fonts.semibold, fontSize: fontSize.md },
  subIcons: { flexDirection: 'row', gap: spacing.sm, marginLeft: spacing.sm },
  quick: {
    position: 'absolute',
    top: spacing.xl + 8,
    left: spacing.sm,
    right: spacing.sm,
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.xs,
  },
  qa: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.92)',
    borderRadius: radius.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: 2,
    gap: 4,
  },
  qaIcon: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  qaText: { fontFamily: fonts.medium, fontSize: 10, color: colors.text, textAlign: 'center' },
  badge: {
    position: 'absolute',
    top: -4,
    right: -6,
    backgroundColor: colors.navy,
    borderRadius: 9,
    minWidth: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: colors.white,
  },
  badgeText: { color: colors.white, fontFamily: fonts.bold, fontSize: 10 },
  modeBox: { position: 'absolute', left: spacing.lg, right: spacing.lg, bottom: spacing.lg, gap: spacing.sm },
  modeHint: {
    alignSelf: 'center',
    backgroundColor: 'rgba(6,32,91,0.75)',
    color: colors.white,
    fontFamily: fonts.medium,
    fontSize: 12,
    paddingHorizontal: spacing.md,
    paddingVertical: 4,
    borderRadius: radius.pill,
    overflow: 'hidden',
  },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, justifyContent: 'center' },
  modes: { flexDirection: 'row', gap: spacing.md },
  modeBtn: { flex: 1, minHeight: 56 },
  stepCard: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: colors.white,
    borderTopLeftRadius: radius.md,
    borderTopRightRadius: radius.md,
    overflow: 'hidden',
  },
  stepBar: { backgroundColor: colors.primary, paddingVertical: 6, alignItems: 'center' },
  stepBarText: { color: colors.white, fontFamily: fonts.semibold, fontSize: fontSize.md },
  stepCount: { color: 'rgba(255,255,255,0.85)', fontFamily: fonts.regular, fontSize: 10 },
  stepBody: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, padding: spacing.md, backgroundColor: '#F2F2F2' },
  partName: { fontFamily: fonts.bold, fontSize: fontSize.sm, color: colors.text },
  instruction: { fontFamily: fonts.regular, fontSize: fontSize.sm, color: colors.text, marginTop: 2 },
  tapHint: { fontFamily: fonts.medium, fontSize: 11, color: colors.orange, marginTop: 4 },
  exit: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: radius.pill,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  exitText: { color: colors.white, fontFamily: fonts.medium, fontSize: 11 },
  handle: {
    position: 'absolute',
    right: 0,
    top: '38%',
    width: 12,
    height: 80,
    backgroundColor: colors.primary,
    borderTopLeftRadius: 6,
    borderBottomLeftRadius: 6,
  },
});
