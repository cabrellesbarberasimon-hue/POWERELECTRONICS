import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useCourse, usePosts, useProgress, useStepOutcome } from '@/hooks/api';
import { useI18n } from '@/i18n';
import { CommunityPost } from '@/modules/social/CommunityPost';
import { nextStep, progressPercent } from '@/modules/university/progress';
import { CTAButton, EmptyState, Header, HeaderIcon, Loading, OutlineButton, ProgressRing, SegmentedTabs, SideMenu, toast } from '@/shared/components';
import { useUser } from '@/stores/session';
import { colors, fonts, fontSize, radius, spacing } from '@/theme';
import type { ContentType, CourseStep } from '@/types/domain';

const TYPE_ICON: Record<ContentType, keyof typeof Ionicons.glyphMap> = {
  text: 'list',
  '3d': 'cube-outline',
  video: 'videocam',
  document: 'document',
  test: 'checkbox-outline',
};
const FILTERS: (ContentType | 'all')[] = ['all', '3d', 'video', 'document', 'test'];

/** Course content: Corporate index + Community (Figure 2). */
export default function CourseScreen() {
  const { id, tab: initialTab } = useLocalSearchParams<{ id: string; tab?: 'corporate' | 'community' }>();
  const { t, tr } = useI18n();
  const insets = useSafeAreaInsets();
  const user = useUser();
  const course = useCourse(id);
  const progress = useProgress(user.id);
  const posts = usePosts({ courseId: id });
  const outcome = useStepOutcome();

  const [tab, setTab] = useState<'corporate' | 'community'>(initialTab ?? 'corporate');
  const [open, setOpen] = useState<string | null>(null);
  const [filter, setFilter] = useState<ContentType | 'all'>('all');
  const [searching, setSearching] = useState(false);
  const [query, setQuery] = useState('');
  const [communitySection, setCommunitySection] = useState<string | null>(null);

  const p = progress.data?.find((x) => x.courseId === id);
  const matchesStep = (s: CourseStep) =>
    (filter === 'all' || s.type === filter) && (!query.trim() || tr(s.title).toLowerCase().includes(query.trim().toLowerCase()));

  const sectionId = communitySection ?? course.data?.sections[0]?.id;
  const sectionPosts = useMemo(() => (posts.data ?? []).filter((x) => x.sectionId === sectionId), [posts.data, sectionId]);

  if (!course.data || !progress.data) return <Loading />;
  const c = course.data;
  const percent = progressPercent(c, p);
  const next = nextStep(c, p);
  const openSection = open ?? (query || filter !== 'all' ? '*' : c.sections.find((s) => s.steps.some((st) => st.id === next?.id))?.id ?? c.sections[0].id);

  const openLesson = (stepId: string) => router.push({ pathname: '/university/lesson/[courseId]/[stepId]', params: { courseId: c.id, stepId } });
  const openTraining = () =>
    router.push(c.equipmentId ? { pathname: '/training/[equipmentId]', params: { equipmentId: c.equipmentId } } : '/training');

  return (
    <View style={{ flex: 1, backgroundColor: colors.white }}>
      <Header breadcrumb title={c.path.join('/')} right={<HeaderIcon icon="search" label={t('common.search')} onPress={() => setSearching((s) => !s)} />} />
      {searching && (
        <View style={styles.searchBar}>
          <TextInput autoFocus value={query} onChangeText={setQuery} placeholder={t('common.search')} style={styles.searchInput} />
        </View>
      )}

      {tab === 'corporate' && (
        <View style={styles.filters}>
          {FILTERS.map((f) => (
            <Pressable key={f} onPress={() => setFilter(f)} accessibilityRole="button" accessibilityLabel={f === 'all' ? t('university.filterAll') : t(`university.types.${f}`)} style={[styles.filter, filter === f && styles.filterOn]}>
              <Ionicons name={f === 'all' ? 'list' : TYPE_ICON[f]} size={22} color={filter === f ? colors.white : colors.primary} />
            </Pressable>
          ))}
        </View>
      )}

      <SegmentedTabs
        items={[
          { key: 'corporate', label: t('university.corporate') },
          { key: 'community', label: t('university.community') },
        ]}
        value={tab}
        onChange={setTab}
      />

      {tab === 'corporate' ? (
        <ScrollView contentContainerStyle={styles.content}>
          <View style={styles.indexRow}>
            <Text style={styles.index}>{t('university.index')}</Text>
            <ProgressRing percent={percent} size={40} stroke={4} />
          </View>
          <Text style={styles.courseTitle}>{tr(c.title)}</Text>

          {c.sections.map((s) => {
            const steps = s.steps.filter(matchesStep);
            if (!steps.length) return null;
            const expanded = openSection === '*' || openSection === s.id;
            return (
              <View key={s.id} style={{ marginBottom: spacing.sm }}>
                <Pressable style={styles.section} onPress={() => setOpen(expanded ? '' : s.id)} accessibilityRole="button" accessibilityState={{ expanded }}>
                  <Ionicons name={expanded ? 'chevron-down' : 'chevron-forward'} size={16} color={colors.white} />
                  <Text style={styles.sectionText}>{tr(s.title)}</Text>
                </Pressable>
                {expanded &&
                  steps.map((st) => {
                    const done = p?.completedStepIds.includes(st.id);
                    const n = s.steps.indexOf(st) + 1;
                    return (
                      <View key={st.id} style={styles.step}>
                        <Pressable style={{ flex: 1 }} onPress={() => openLesson(st.id)} accessibilityRole="button" accessibilityLabel={tr(st.title)}>
                          <Text style={[styles.stepText, done && styles.stepDone]}>
                            <Text style={styles.stepNum}>{n}. </Text>
                            {tr(st.title)}
                          </Text>
                          <View style={styles.stepMeta}>
                            <Ionicons name={TYPE_ICON[st.type]} size={12} color={colors.textMuted} />
                            <Text style={styles.stepMetaText}>
                              {t(`university.types.${st.type}`)} · {t('common.minutes', { count: st.durationMin })}
                            </Text>
                            {done && <Ionicons name="checkmark-circle" size={14} color={colors.green} />}
                          </View>
                        </Pressable>
                        <View style={styles.stepActions}>
                          <RoundIcon icon="add" bg={colors.black} label={t('university.contribute')} onPress={() => router.push({ pathname: '/university/add-content', params: { courseId: c.id, sectionId: s.id } })} />
                          <RoundIcon icon="chatbox-ellipses" bg={colors.black} label={t('university.discuss')} onPress={() => { setCommunitySection(s.id); setTab('community'); }} />
                          <RoundIcon
                            icon="close"
                            bg={colors.red}
                            label={t('university.reportDifficulty')}
                            onPress={() => outcome.mutate({ courseId: c.id, stepId: st.id, outcome: 'failed' }, { onSuccess: () => toast(t('university.reported')) })}
                          />
                        </View>
                      </View>
                    );
                  })}
              </View>
            );
          })}

          <OutlineButton
            testID="course-start"
            label={next ? (percent ? t('common.continue') : t('common.start')) : t('university.courseDone')}
            iconRight="chevron-forward"
            compact
            disabled={!next}
            onPress={() => next && openLesson(next.id)}
            style={styles.start}
          />
        </ScrollView>
      ) : (
        <View style={{ flex: 1, backgroundColor: colors.surface }}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.sectionChips} style={{ flexGrow: 0 }}>
            {c.sections.map((s) => {
              const count = (posts.data ?? []).filter((x) => x.sectionId === s.id).length;
              const active = s.id === sectionId;
              return (
                <Pressable key={s.id} onPress={() => setCommunitySection(s.id)} style={[styles.sectionChip, active && styles.sectionChipOn]}>
                  <Text style={[styles.sectionChipText, active && { color: colors.text }]}>/{tr(s.title)}</Text>
                  <View style={styles.countBubble}>
                    <Text style={styles.countText}>{count}</Text>
                  </View>
                </Pressable>
              );
            })}
          </ScrollView>
          <ScrollView contentContainerStyle={{ padding: spacing.lg, gap: spacing.md, paddingBottom: 140 }}>
            {sectionPosts.length === 0 && <EmptyState text={t('university.noCommunity')} icon="people-outline" />}
            {sectionPosts.length > 0 && <View style={styles.thread} />}
            {sectionPosts.map((post, i) => (
              <CommunityPost key={post.id} post={post} featured={i === 0} />
            ))}
          </ScrollView>
          <Pressable
            testID="community-add"
            style={styles.fab}
            onPress={() => router.push({ pathname: '/university/add-content', params: { courseId: c.id, sectionId } })}
            accessibilityRole="button"
            accessibilityLabel={t('university.addContent')}
          >
            <Ionicons name="add" size={30} color={colors.white} />
          </Pressable>
        </View>
      )}

      <View style={[styles.footer, { paddingBottom: insets.bottom + spacing.sm }]}>
        <CTAButton label={t('university.trainingExperience')} onPress={openTraining} icon={c.equipmentId ? 'scan' : undefined} />
      </View>
      <SideMenu top="45%" />
    </View>
  );
}

function RoundIcon({ icon, bg, onPress, label }: { icon: keyof typeof Ionicons.glyphMap; bg: string; onPress: () => void; label: string }) {
  return (
    <Pressable onPress={onPress} hitSlop={6} accessibilityRole="button" accessibilityLabel={label} style={[styles.round, { backgroundColor: bg }]}>
      <Ionicons name={icon} size={14} color={colors.white} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  searchBar: { paddingHorizontal: spacing.lg, paddingVertical: spacing.sm, backgroundColor: colors.primarySoft },
  searchInput: { backgroundColor: colors.white, borderRadius: radius.pill, paddingHorizontal: spacing.md, height: 38, fontFamily: fonts.regular },
  filters: { flexDirection: 'row', justifyContent: 'space-around', paddingVertical: spacing.sm, borderBottomWidth: 1, borderColor: colors.border },
  filter: { padding: 6, borderRadius: radius.sm },
  filterOn: { backgroundColor: colors.primary },
  content: { padding: spacing.lg, paddingBottom: 120 },
  indexRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderBottomWidth: 1, borderColor: colors.border, paddingBottom: 6 },
  index: { fontFamily: fonts.regular, fontSize: fontSize.lg, color: colors.textMuted },
  courseTitle: { fontFamily: fonts.semibold, fontSize: fontSize.md, color: colors.navy, marginVertical: spacing.md },
  section: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: colors.primary, paddingVertical: spacing.md, paddingHorizontal: spacing.md },
  sectionText: { color: colors.white, fontFamily: fonts.semibold, fontSize: fontSize.md },
  step: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.sm, paddingHorizontal: spacing.md, borderBottomWidth: 1, borderColor: '#EEE' },
  stepNum: { fontFamily: fonts.semibold, color: colors.text },
  stepText: { fontFamily: fonts.regular, fontSize: fontSize.sm, color: '#555', lineHeight: 19 },
  stepDone: { color: colors.textMuted },
  stepMeta: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  stepMetaText: { fontFamily: fonts.regular, fontSize: 10, color: colors.textMuted },
  stepActions: { flexDirection: 'row', gap: 4 },
  round: { width: 24, height: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  start: { alignSelf: 'center', marginTop: spacing.xl, minWidth: 140 },
  sectionChips: { paddingHorizontal: spacing.lg, paddingVertical: spacing.md, gap: spacing.md },
  sectionChip: { flexDirection: 'row', alignItems: 'center', gap: 6, borderBottomWidth: 2, borderColor: 'transparent', paddingBottom: 2 },
  sectionChipOn: { borderColor: colors.darkTab },
  sectionChipText: { fontFamily: fonts.regular, fontSize: fontSize.md, color: colors.textMuted },
  countBubble: { borderWidth: 1, borderColor: colors.textMuted, borderRadius: 6, paddingHorizontal: 5 },
  countText: { fontFamily: fonts.medium, fontSize: 10, color: colors.textMuted },
  thread: { position: 'absolute', left: spacing.lg + 10, top: 120, bottom: 140, width: 2, backgroundColor: colors.border },
  fab: { position: 'absolute', right: spacing.xl, bottom: 90, width: 56, height: 56, borderRadius: 28, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center', elevation: 6, shadowColor: '#000', shadowOpacity: 0.25, shadowRadius: 6 },
  footer: { position: 'absolute', left: 0, right: 0, bottom: 0, paddingHorizontal: spacing.xxl, paddingTop: spacing.sm },
});

