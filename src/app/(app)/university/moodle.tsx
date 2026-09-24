import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useAddLesson, useCourses, useCreatePost } from '@/hooks/api';
import { useI18n } from '@/i18n';
import { Chip, Header, PrimaryButton, Screen, toast } from '@/shared/components';
import { useUser } from '@/stores/session';
import { colors, fonts, fontSize, radius, spacing } from '@/theme';
import type { ContentType } from '@/types/domain';

const TYPES: ContentType[] = ['text', 'video', 'document', '3d', 'test'];

/**
 * Moodle Content: instructors publish lessons directly into the Corporate tab;
 * other employees send them to the Community for review.
 */
export default function MoodleContent() {
  const params = useLocalSearchParams<{ courseId?: string; sectionId?: string }>();
  const { t, tr } = useI18n();
  const user = useUser();
  const courses = useCourses();
  const addLesson = useAddLesson();
  const createPost = useCreatePost();
  const [courseId, setCourseId] = useState(params.courseId || 'c-hem');
  const [sectionId, setSectionId] = useState(params.sectionId || '');
  const [type, setType] = useState<ContentType>('text');
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [url, setUrl] = useState('');

  const course = courses.data?.find((c) => c.id === courseId);
  const section = course?.sections.find((s) => s.id === sectionId) ?? course?.sections[0];
  const canPublishCorporate = user.role === 'instructor' || user.role === 'admin';

  const submit = async () => {
    if (!course || !section || !title.trim()) return;
    const text = url ? `${body}\n\n${url}` : body;
    if (canPublishCorporate) {
      await addLesson.mutateAsync({
        courseId: course.id,
        sectionId: section.id,
        lesson: { title: { en: title, es: title }, body: { en: text, es: text }, type, durationMin: 8, tags: course.tags.slice(0, 2) },
      });
      toast(t('moodle.published'), 'success');
    } else {
      await createPost.mutateAsync({
        authorId: user.id,
        title,
        body: text,
        media: { kind: type === 'video' ? 'video' : type === '3d' ? '3d' : 'text', tint: '#F5F6F8' },
        tags: ['moodle', ...course.tags.slice(0, 2)],
        courseId: course.id,
        sectionId: section.id,
      });
      toast(t('moodle.sentForReview'), 'success');
    }
    router.back();
  };

  return (
    <Screen header={<Header title={t('moodle.title')} />}>
      <Text style={styles.hint}>{t('moodle.hint')}</Text>

      <Text style={styles.label}>{t('moodle.course')}</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
        {courses.data?.map((c) => (
          <Chip key={c.id} label={c.code} active={c.id === courseId} onPress={() => { setCourseId(c.id); setSectionId(''); }} />
        ))}
      </ScrollView>

      <Text style={styles.label}>{t('moodle.section')}</Text>
      <View style={[styles.chips, { flexWrap: 'wrap' }]}>
        {course?.sections.map((s) => (
          <Chip key={s.id} label={tr(s.title)} active={s.id === section?.id} onPress={() => setSectionId(s.id)} />
        ))}
      </View>

      <Text style={styles.label}>{t('moodle.type')}</Text>
      <View style={[styles.chips, { flexWrap: 'wrap' }]}>
        {TYPES.map((ty) => (
          <Chip key={ty} label={t(`university.types.${ty}`)} active={ty === type} onPress={() => setType(ty)} />
        ))}
      </View>

      <Text style={styles.label}>{t('moodle.lessonTitle')}</Text>
      <TextInput value={title} onChangeText={setTitle} style={styles.input} />
      <Text style={styles.label}>{t('moodle.lessonBody')}</Text>
      <TextInput value={body} onChangeText={setBody} style={[styles.input, { height: 120, textAlignVertical: 'top' }]} multiline />
      <Text style={styles.label}>{t('moodle.moodleUrl')}</Text>
      <TextInput value={url} onChangeText={setUrl} style={styles.input} autoCapitalize="none" placeholder="https://moodle.power-electronics.com/…" />

      <PrimaryButton label={t('common.publish')} icon="cloud-upload-outline" onPress={submit} disabled={!title.trim()} loading={addLesson.isPending || createPost.isPending} style={{ marginTop: spacing.xl }} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  hint: { fontFamily: fonts.regular, fontSize: fontSize.sm, color: colors.textMuted, backgroundColor: colors.primarySoft, padding: spacing.md, borderRadius: radius.md },
  label: { fontFamily: fonts.semibold, fontSize: fontSize.sm, color: colors.text, marginTop: spacing.lg, marginBottom: spacing.sm },
  chips: { flexDirection: 'row', gap: spacing.sm },
  input: { borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, fontFamily: fonts.regular, fontSize: fontSize.md, color: colors.text, minHeight: 44 },
});
