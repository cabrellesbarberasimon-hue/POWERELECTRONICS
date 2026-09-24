import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useCourse, useProgress, useStepOutcome } from '@/hooks/api';
import { useI18n } from '@/i18n';
import { allSteps, findStep, gradeQuiz } from '@/modules/university/progress';
import {
  CTAButton,
  GhostButton,
  Header,
  LinearProgress,
  Loading,
  MediaView,
  Model3D,
  OutlineButton,
  PrimaryButton,
  Screen,
  toast,
} from '@/shared/components';
import { useUser } from '@/stores/session';
import { colors, fonts, fontSize, radius, spacing } from '@/theme';
import type { CourseStep } from '@/types/domain';

export default function Lesson() {
  const { courseId, stepId } = useLocalSearchParams<{ courseId: string; stepId: string }>();
  const { t, tr } = useI18n();
  const user = useUser();
  const course = useCourse(courseId);
  const progress = useProgress(user.id);
  const outcome = useStepOutcome();

  if (!course.data || !progress.data) return <Loading />;
  const found = findStep(course.data, stepId);
  if (!found) return <Loading />;
  const { step, section } = found;
  const steps = allSteps(course.data);
  const idx = steps.findIndex((s) => s.id === step.id);
  const next = steps[idx + 1];
  const done = progress.data.find((p) => p.courseId === courseId)?.completedStepIds.includes(step.id);

  const complete = () =>
    outcome.mutate({ courseId, stepId: step.id, outcome: 'completed' }, { onSuccess: () => toast(t('university.completed'), 'success') });
  const goNext = () =>
    next ? router.replace({ pathname: '/university/lesson/[courseId]/[stepId]', params: { courseId, stepId: next.id } }) : router.back();

  return (
    <Screen header={<Header breadcrumb title={`${course.data.path.join('/')}/${idx + 1}`} />}>
      <Text style={styles.section}>{tr(section.title)}</Text>
      <Text style={styles.title}>{tr(step.title)}</Text>
      <View style={styles.meta}>
        <Text style={styles.badge}>{t(`university.types.${step.type}`)}</Text>
        <Text style={styles.metaText}>{t('common.minutes', { count: step.durationMin })}</Text>
        {done && (
          <>
            <Ionicons name="checkmark-circle" size={16} color={colors.green} />
            <Text style={[styles.metaText, { color: colors.green }]}>{t('university.completed')}</Text>
          </>
        )}
      </View>

      <StepContent
        key={step.id}
        step={step}
        onPassed={complete}
        onFailed={() => outcome.mutate({ courseId, stepId: step.id, outcome: 'failed' })}
      />

      <View style={styles.actions}>
        {step.type !== 'test' && !done && (
          <PrimaryButton
            testID="mark-done"
            label={t('university.markDone')}
            icon="checkmark"
            onPress={complete}
            loading={outcome.isPending}
          />
        )}
        {step.partId && course.data.equipmentId && (
          <CTAButton
            label={t('lesson.practiceAR')}
            icon="scan"
            onPress={() =>
              router.push({ pathname: '/training/[equipmentId]', params: { equipmentId: course.data!.equipmentId!, part: step.partId } })
            }
          />
        )}
        <OutlineButton label={next ? t('university.nextLesson') : t('common.done')} iconRight="chevron-forward" onPress={goNext} />
        <GhostButton
          label={t('university.reportDifficulty')}
          icon="alert-circle-outline"
          onPress={() =>
            outcome.mutate({ courseId, stepId: step.id, outcome: 'failed' }, { onSuccess: () => toast(t('university.reported')) })
          }
        />
      </View>
    </Screen>
  );
}

function StepContent({ step, onPassed, onFailed }: { step: CourseStep; onPassed: () => void; onFailed: () => void }) {
  const { t, tr } = useI18n();
  switch (step.type) {
    case 'video':
      return <VideoMock step={step} />;
    case '3d':
      return (
        <View style={styles.box}>
          <Model3D />
          <Text style={styles.hint}>{t('lesson.rotate')}</Text>
          <Text style={styles.body}>{tr(step.body)}</Text>
        </View>
      );
    case 'document':
      return (
        <View style={styles.doc}>
          <View style={styles.docHead}>
            <Ionicons name="document-text" size={26} color={colors.red} />
            <Text style={styles.docTitle}>{tr(step.title)}.pdf</Text>
            <Text style={styles.metaText}>{t('lesson.pages', { count: 4 })}</Text>
          </View>
          <Text style={styles.body}>{tr(step.body)}</Text>
          {[80, 95, 60, 88, 70].map((w, i) => (
            <View key={i} style={[styles.line, { width: `${w}%` }]} />
          ))}
        </View>
      );
    case 'test':
      return <Quiz step={step} onPassed={onPassed} onFailed={onFailed} />;
    default:
      return (
        <View style={styles.box}>
          <Text style={styles.body}>{tr(step.body)}</Text>
        </View>
      );
  }
}

function VideoMock({ step }: { step: CourseStep }) {
  const { tr } = useI18n();
  const [playing, setPlaying] = useState(false);
  const [pos, setPos] = useState(0);
  const total = step.durationMin * 60;
  useEffect(() => {
    if (!playing) return;
    const id = setInterval(() => setPos((p) => (p + 15 >= total ? (setPlaying(false), total) : p + 15)), 250);
    return () => clearInterval(id);
  }, [playing, total]);
  return (
    <View style={{ gap: spacing.sm }}>
      <Pressable onPress={() => setPlaying((p) => !p)} accessibilityRole="button" accessibilityLabel="play">
        <MediaView media={{ kind: 'video', tint: colors.navy }} style={{ height: 200 }} />
        <View style={styles.playOverlay}>
          <Ionicons name={playing ? 'pause-circle' : 'play-circle'} size={64} color="rgba(255,255,255,0.95)" />
        </View>
      </Pressable>
      <LinearProgress percent={(pos / total) * 100} color={colors.orange} />
      <Text style={styles.body}>{tr(step.body)}</Text>
    </View>
  );
}

function Quiz({ step, onPassed, onFailed }: { step: CourseStep; onPassed: () => void; onFailed: () => void }) {
  const { t, tr } = useI18n();
  const quiz = step.quiz ?? [];
  const [answers, setAnswers] = useState<number[]>([]);
  const [result, setResult] = useState<{ score: number; passed: boolean } | null>(null);

  const submit = () => {
    const r = gradeQuiz(
      answers,
      quiz.map((q) => q.answer),
    );
    setResult(r);
    if (r.passed) onPassed();
    else onFailed();
  };

  return (
    <View style={{ gap: spacing.lg }}>
      {quiz.map((q, qi) => (
        <View key={qi} style={styles.box}>
          <Text style={styles.question}>
            {qi + 1}. {tr(q.question)}
          </Text>
          {q.options.map((o, oi) => {
            const selected = answers[qi] === oi;
            const reveal = result && (oi === q.answer ? styles.optCorrect : selected ? styles.optWrong : null);
            return (
              <Pressable
                key={oi}
                disabled={!!result}
                onPress={() => setAnswers((a) => Object.assign([...a], { [qi]: oi }))}
                style={[styles.opt, selected && styles.optOn, reveal]}
                accessibilityRole="radio"
                accessibilityState={{ selected }}
              >
                <Ionicons name={selected ? 'radio-button-on' : 'radio-button-off'} size={18} color={colors.primary} />
                <Text style={styles.optText}>{tr(o)}</Text>
              </Pressable>
            );
          })}
        </View>
      ))}
      {result ? (
        <View style={[styles.result, { backgroundColor: result.passed ? '#E8F8EE' : '#FDECEC' }]}>
          <Text style={[styles.resultText, { color: result.passed ? colors.green : colors.red }]}>
            {result.passed
              ? t('lesson.passed', { score: Math.round(result.score * 100) })
              : t('lesson.failed', { score: Math.round(result.score * 100) })}
          </Text>
          {!result.passed && (
            <GhostButton
              label={t('lesson.tryAgain')}
              icon="refresh"
              onPress={() => {
                setAnswers([]);
                setResult(null);
              }}
            />
          )}
        </View>
      ) : (
        <PrimaryButton
          testID="quiz-submit"
          label={t('lesson.submit')}
          disabled={answers.filter((a) => a !== undefined).length < quiz.length}
          onPress={submit}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  section: { fontFamily: fonts.medium, fontSize: fontSize.sm, color: colors.primary },
  title: { fontFamily: fonts.semibold, fontSize: fontSize.xl, color: colors.text, marginTop: 4 },
  meta: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginVertical: spacing.md },
  badge: {
    backgroundColor: colors.primarySoft,
    color: colors.primary,
    fontFamily: fonts.semibold,
    fontSize: 11,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: radius.sm,
    overflow: 'hidden',
  },
  metaText: { fontFamily: fonts.regular, fontSize: fontSize.xs, color: colors.textMuted },
  box: { backgroundColor: colors.surfaceAlt, borderRadius: radius.lg, padding: spacing.lg, gap: spacing.sm },
  body: { fontFamily: fonts.regular, fontSize: fontSize.md, color: colors.text, lineHeight: 23 },
  hint: { fontFamily: fonts.regular, fontSize: fontSize.xs, color: colors.textMuted, textAlign: 'center' },
  doc: { borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, padding: spacing.lg, gap: spacing.sm },
  docHead: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  docTitle: { flex: 1, fontFamily: fonts.semibold, fontSize: fontSize.sm, color: colors.text },
  line: { height: 8, borderRadius: 4, backgroundColor: colors.surface },
  playOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, alignItems: 'center', justifyContent: 'center' },
  question: { fontFamily: fonts.semibold, fontSize: fontSize.md, color: colors.text },
  opt: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.white,
  },
  optOn: { borderColor: colors.primary },
  optCorrect: { borderColor: colors.green, backgroundColor: '#E8F8EE' },
  optWrong: { borderColor: colors.red, backgroundColor: '#FDECEC' },
  optText: { flex: 1, fontFamily: fonts.regular, fontSize: fontSize.sm, color: colors.text },
  result: { borderRadius: radius.md, padding: spacing.lg, alignItems: 'center', gap: spacing.sm },
  resultText: { fontFamily: fonts.semibold, fontSize: fontSize.md, textAlign: 'center' },
  actions: { gap: spacing.md, marginTop: spacing.xl },
});
