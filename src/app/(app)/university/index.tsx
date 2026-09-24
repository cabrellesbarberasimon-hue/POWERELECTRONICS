import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useCourses, useProgress } from '@/hooks/api';
import { useI18n } from '@/i18n';
import { ADVANCED_UNLOCK_PERCENT, levelPercent, progressPercent } from '@/modules/university/progress';
import { CourseRow } from '@/modules/university/CourseRow';
import { CTAButton, Card, EmptyState, LinearProgress, Loading, ModuleCard, SegmentedTabs, SideMenu } from '@/shared/components';
import { useUser } from '@/stores/session';
import { colors, fonts, fontSize, radius, spacing } from '@/theme';
import type { Level } from '@/types/domain';

/** Corporate University entry: LEVELS / COURSES (Figure 1, "View Courses"). */
export default function University() {
  const { t } = useI18n();
  const insets = useSafeAreaInsets();
  const user = useUser();
  const [tab, setTab] = useState<'levels' | 'courses'>('courses');
  const [query, setQuery] = useState('');
  const courses = useCourses();
  const progress = useProgress(user.id);
  const search = useCourses(query.trim() ? { query } : undefined);

  if (!courses.data || !progress.data) return <Loading />;

  const basic = levelPercent(courses.data, 'basic', progress.data);
  const advanced = levelPercent(courses.data, 'advanced', progress.data);
  const advancedLocked = user.role === 'employee' && basic < ADVANCED_UNLOCK_PERCENT;
  const openLevel = (level: Level) => router.push({ pathname: '/university/level/[level]', params: { level } });

  return (
    <View style={{ flex: 1, backgroundColor: colors.white }}>
      <View style={{ paddingTop: insets.top, backgroundColor: colors.darkTab }}>
        <SegmentedTabs
          showIcons={false}
          leading={
            <Pressable style={styles.home} onPress={() => router.dismissTo('/home')} accessibilityRole="button" accessibilityLabel="Home">
              <Ionicons name="home" size={22} color={colors.white} />
            </Pressable>
          }
          items={[
            { key: 'levels', label: t('university.levels') },
            { key: 'courses', label: t('university.courses') },
          ]}
          value={tab}
          onChange={setTab}
        />
      </View>

      {tab === 'courses' ? (
        <View style={styles.body}>
          <View style={styles.search}>
            <Ionicons name="search" size={18} color={colors.textMuted} />
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder={t('university.searchCourses')}
              style={styles.searchInput}
              accessibilityLabel={t('common.search')}
            />
            {!!query && (
              <Pressable onPress={() => setQuery('')} accessibilityLabel={t('common.close')}>
                <Ionicons name="close-circle" size={18} color={colors.textMuted} />
              </Pressable>
            )}
          </View>

          {query.trim() ? (
            <View style={{ flex: 1, gap: spacing.md }}>
              {search.data?.length === 0 && <EmptyState text={t('university.noCourses')} icon="search" />}
              {search.data?.map((c) => (
                <CourseRow
                  key={c.id}
                  course={c}
                  percent={progressPercent(
                    c,
                    progress.data.find((p) => p.courseId === c.id),
                  )}
                />
              ))}
            </View>
          ) : (
            <View style={{ flex: 1, gap: spacing.lg }}>
              <ModuleCard
                testID="level-basic"
                style={{ flex: 1 }}
                label={t('university.basic')}
                onPress={() => openLevel('basic')}
                icon={
                  <View style={styles.circle}>
                    <MaterialCommunityIcons name="tools" size={48} color={colors.white} />
                  </View>
                }
                footer={<Text style={styles.footer}>{t('university.levelProgress', { percent: basic })}</Text>}
              />
              <ModuleCard
                testID="level-advanced"
                style={{ flex: 1 }}
                label={t('university.advanced')}
                onPress={() => openLevel('advanced')}
                icon={
                  <View style={styles.circle}>
                    <MaterialCommunityIcons name="laptop" size={48} color={colors.white} />
                    <MaterialCommunityIcons name="cube-outline" size={20} color={colors.white} style={{ position: 'absolute', top: 24 }} />
                  </View>
                }
                footer={
                  <Text style={styles.footer}>
                    {advancedLocked
                      ? `🔒 ${t('university.locked', { percent: ADVANCED_UNLOCK_PERCENT })}`
                      : t('university.levelProgress', { percent: advanced })}
                  </Text>
                }
              />
            </View>
          )}
          <CTAButton
            testID="training-experience"
            label={t('university.trainingExperience')}
            onPress={() => router.push('/training')}
            style={{ marginTop: spacing.lg, marginBottom: insets.bottom + spacing.sm }}
          />
        </View>
      ) : (
        <View style={[styles.body, { gap: spacing.lg }]}>
          {(['basic', 'advanced'] as const).map((level) => {
            const pct = level === 'basic' ? basic : advanced;
            const locked = level === 'advanced' && advancedLocked;
            const levelCourses = courses.data.filter((c) => c.level === level);
            return (
              <Card key={level} onPress={() => openLevel(level)}>
                <View style={styles.levelHead}>
                  <Ionicons
                    name={locked ? 'lock-closed' : level === 'basic' ? 'ribbon-outline' : 'trophy-outline'}
                    size={26}
                    color={locked ? colors.textMuted : colors.primary}
                  />
                  <Text style={styles.levelTitle}>{t(level === 'basic' ? 'university.basicShort' : 'university.advancedShort')}</Text>
                  <Text style={styles.levelPct}>{pct}%</Text>
                </View>
                <LinearProgress percent={pct} color={locked ? colors.textMuted : colors.primary} />
                {locked && <Text style={styles.lockText}>{t('university.locked', { percent: ADVANCED_UNLOCK_PERCENT })}</Text>}
                <View style={{ marginTop: spacing.md, gap: 6 }}>
                  {levelCourses.map((c) => {
                    const p = progressPercent(
                      c,
                      progress.data.find((x) => x.courseId === c.id),
                    );
                    return (
                      <View key={c.id} style={styles.levelCourse}>
                        <Ionicons
                          name={p === 100 ? 'checkmark-circle' : 'ellipse-outline'}
                          size={16}
                          color={p === 100 ? colors.green : colors.border}
                        />
                        <Text style={styles.levelCourseText} numberOfLines={1}>
                          {c.code} · {p}%
                        </Text>
                      </View>
                    );
                  })}
                </View>
              </Card>
            );
          })}
        </View>
      )}
      <SideMenu top="35%" />
    </View>
  );
}

const styles = StyleSheet.create({
  home: { paddingHorizontal: spacing.lg, justifyContent: 'center', backgroundColor: colors.darkTab },
  body: { flex: 1, padding: spacing.lg },
  search: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.lg,
    height: 42,
  },
  searchInput: { flex: 1, fontFamily: fonts.regular, fontSize: fontSize.sm, color: colors.text },
  circle: { width: 96, height: 96, borderRadius: 48, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  footer: { fontFamily: fonts.regular, fontSize: fontSize.xs, color: colors.textMuted, textAlign: 'center' },
  levelHead: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.sm },
  levelTitle: { flex: 1, fontFamily: fonts.semibold, fontSize: fontSize.lg, color: colors.text },
  levelPct: { fontFamily: fonts.bold, fontSize: fontSize.lg, color: colors.primary },
  lockText: { fontFamily: fonts.regular, fontSize: fontSize.xs, color: colors.textMuted, marginTop: 6 },
  levelCourse: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  levelCourseText: { fontFamily: fonts.regular, fontSize: fontSize.sm, color: colors.text },
});
