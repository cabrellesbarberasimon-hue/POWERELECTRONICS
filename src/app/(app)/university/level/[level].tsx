import { useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { ScrollView, View } from 'react-native';
import { useCourses, useProgress } from '@/hooks/api';
import { useI18n } from '@/i18n';
import { CourseRow } from '@/modules/university/CourseRow';
import { progressPercent } from '@/modules/university/progress';
import { Chip, EmptyState, Header, Loading, Screen } from '@/shared/components';
import { useUser } from '@/stores/session';
import { spacing } from '@/theme';
import type { Area, Level } from '@/types/domain';

const AREAS: Area[] = ['solar', 'drives', 'power', 'safety'];

export default function LevelCourses() {
  const { level } = useLocalSearchParams<{ level: Level }>();
  const { t } = useI18n();
  const user = useUser();
  const [area, setArea] = useState<Area | undefined>();
  const courses = useCourses({ level, area });
  const progress = useProgress(user.id);

  return (
    <Screen header={<Header breadcrumb title={`COURSES/${level === 'advanced' ? 'ADVANCED' : 'BASIC'}${area ? `/${area}` : ''}`} />}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: spacing.sm, paddingBottom: spacing.md }}>
        <Chip label={t('university.filterAll')} active={!area} onPress={() => setArea(undefined)} />
        {AREAS.map((a) => (
          <Chip key={a} label={t(`university.area.${a}`)} active={area === a} onPress={() => setArea(a)} />
        ))}
      </ScrollView>
      {!courses.data || !progress.data ? (
        <Loading />
      ) : courses.data.length === 0 ? (
        <EmptyState text={t('university.noCourses')} />
      ) : (
        <View style={{ gap: spacing.md }}>
          {courses.data.map((c) => (
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
      )}
    </Screen>
  );
}
