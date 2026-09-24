import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useRef, useState } from 'react';
import { KeyboardAvoidingView, Modal, PanResponder, Platform, Pressable, ScrollView, Share, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useCourses, useCreatePost } from '@/hooks/api';
import { useI18n } from '@/i18n';
import {
  AVATARS,
  AnnotationToolbar,
  AvatarCharacter,
  CameraBackdrop,
  Chip,
  DrawingLayer,
  PrimaryButton,
  SolarScene,
  toast,
  type AnnotationTool,
  type CameraBackdropHandle,
  type Stroke,
} from '@/shared/components';
import { useUser } from '@/stores/session';
import { colors, fonts, fontSize, radius, spacing } from '@/theme';
import type { MediaKind } from '@/types/domain';

const TAGS = ['power-module', 'lever', 'maintenance', 'safety', 'software', 'cooling', 'troubleshooting'];

/**
 * Post Content creator (Figure 2, last screen): camera (or demo scene) with an
 * animated avatar overlaid, annotation toolbar and publish form.
 */
export default function CreatePost() {
  const params = useLocalSearchParams<{ courseId?: string; sectionId?: string; challengeId?: string }>();
  const { t, tr } = useI18n();
  const insets = useSafeAreaInsets();
  const user = useUser();
  const courses = useCourses();
  const create = useCreatePost();
  const cam = useRef<CameraBackdropHandle>(null);

  const [avatar, setAvatar] = useState<string | undefined>('engineer');
  const [pickAvatar, setPickAvatar] = useState(false);
  const [tool, setTool] = useState<AnnotationTool>('pointer');
  const [strokes, setStrokes] = useState<Stroke[]>([]);
  const [uri, setUri] = useState<string>();
  const [live, setLive] = useState(false);
  const [videoMode, setVideoMode] = useState(true);
  const [form, setForm] = useState(false);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [courseId, setCourseId] = useState(params.courseId ?? '');
  const [pos, setPos] = useState({ x: 20, y: 0 });

  const drag = useRef({ x: 20, y: 0 });
  const avatarResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderMove: (_, g) => setPos({ x: drag.current.x + g.dx, y: drag.current.y + g.dy }),
      onPanResponderRelease: (_, g) => {
        drag.current = { x: drag.current.x + g.dx, y: drag.current.y + g.dy };
      },
    }),
  ).current;

  const onTool = async (k: AnnotationTool) => {
    if (k === 'capture') {
      const shot = await cam.current?.capture();
      if (shot) setUri(shot);
      setVideoMode((v) => !v);
      toast(videoMode ? '📷' : '🎥');
      return;
    }
    if (k === 'share') {
      Share.share({ message: `SENSE · ${title || t('create.title')}` }).catch(() => undefined);
      return;
    }
    if (k === 'rotate') {
      setAvatar((a) => {
        const i = AVATARS.findIndex((x) => x.id === a);
        return AVATARS[(i + 1) % AVATARS.length].id;
      });
    }
    setTool(k);
  };

  const course = courses.data?.find((c) => c.id === courseId);
  const publish = async () => {
    const kind: MediaKind = videoMode ? 'video' : 'image';
    await create.mutateAsync({
      authorId: user.id,
      title: title.trim() || t('create.title'),
      body: body.trim(),
      media: { kind, tint: colors.primary, avatarId: avatar, uri, durationSec: videoMode ? 30 : undefined },
      tags,
      courseId: course?.id,
      sectionId: course ? params.sectionId || course.sections[0].id : undefined,
      challengeId: params.challengeId,
    });
    toast(t('create.publishTo'), 'success');
    router.back();
  };

  return (
    <View style={styles.root}>
      <CameraBackdrop ref={cam} fallback={<SolarScene />} onModeChange={setLive} />
      <DrawingLayer enabled={tool === 'pen'} strokes={strokes} onChange={setStrokes} />

      {avatar && (
        <View style={[styles.avatar, { transform: [{ translateX: pos.x }, { translateY: pos.y }] }]} {...avatarResponder.panHandlers}>
          <AvatarCharacter id={avatar} height={300} />
        </View>
      )}

      <View style={[styles.top, { paddingTop: insets.top + spacing.sm }]}>
        <Pressable onPress={() => router.back()} accessibilityRole="button" accessibilityLabel={t('common.back')}>
          <Ionicons name="arrow-undo" size={34} color={colors.primary} />
        </Pressable>
        {!live && <Text style={styles.demo}>{t('create.cameraDenied')}</Text>}
        <Pressable onPress={() => setForm(true)} accessibilityRole="button" accessibilityLabel={t('common.publish')} testID="create-done">
          <Ionicons name="checkmark" size={40} color={colors.primary} />
        </Pressable>
      </View>

      <Pressable style={[styles.plus, { bottom: insets.bottom + 90 }]} onPress={() => setPickAvatar((p) => !p)} accessibilityRole="button" accessibilityLabel={t('create.avatar')}>
        <Ionicons name="add" size={30} color={colors.white} />
      </Pressable>

      {pickAvatar && (
        <View style={[styles.picker, { bottom: insets.bottom + 150 }]}>
          <Text style={styles.pickerTitle}>{t('create.avatar')}</Text>
          <View style={{ flexDirection: 'row', gap: spacing.sm, alignItems: 'flex-end' }}>
            <Pressable onPress={() => setAvatar(undefined)} style={[styles.pickItem, !avatar && styles.pickOn]}>
              <Ionicons name="ban" size={28} color={colors.textMuted} />
            </Pressable>
            {AVATARS.map((a) => (
              <Pressable key={a.id} onPress={() => setAvatar(a.id)} style={[styles.pickItem, avatar === a.id && styles.pickOn]} accessibilityLabel={a.id}>
                <AvatarCharacter id={a.id} height={70} animated={false} />
              </Pressable>
            ))}
          </View>
          <Text style={styles.pickerHint}>{t('create.motionScanFuture')}</Text>
        </View>
      )}

      <View style={[styles.toolbar, { paddingBottom: insets.bottom }]}>
        <AnnotationToolbar active={tool} onPress={onTool} labels={t('training.tools', { returnObjects: true }) as Record<AnnotationTool, string>} />
      </View>

      <Modal visible={form} animationType="slide" transparent onRequestClose={() => setForm(false)}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.sheetWrap}>
          <View style={[styles.sheet, { paddingBottom: insets.bottom + spacing.lg }]}>
            <ScrollView keyboardShouldPersistTaps="handled">
              <Text style={styles.sheetTitle}>{t('create.title')}</Text>
              <TextInput testID="post-title" value={title} onChangeText={setTitle} placeholder={t('create.titlePlaceholder')} style={styles.input} />
              <TextInput value={body} onChangeText={setBody} placeholder={t('create.bodyPlaceholder')} multiline style={[styles.input, { height: 90, textAlignVertical: 'top' }]} />
              <Text style={styles.label}>{t('create.mediaType')}</Text>
              <View style={styles.chips}>
                <Chip icon="videocam" label={t('university.types.video')} active={videoMode} onPress={() => setVideoMode(true)} />
                <Chip icon="image" label={t('create.photo')} active={!videoMode} onPress={() => setVideoMode(false)} />
              </View>
              <Text style={styles.label}>{t('moodle.course')}</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
                <Chip label="—" active={!courseId} onPress={() => setCourseId('')} />
                {courses.data?.map((c) => (
                  <Chip key={c.id} label={c.code} active={c.id === courseId} onPress={() => setCourseId(c.id)} />
                ))}
              </ScrollView>
              {course && <Text style={styles.courseName}>{tr(course.title)}</Text>}
              <Text style={styles.label}>{t('create.tags')}</Text>
              <View style={[styles.chips, { flexWrap: 'wrap' }]}>
                {TAGS.map((tag) => (
                  <Chip key={tag} label={`#${tag}`} active={tags.includes(tag)} onPress={() => setTags((ts) => (ts.includes(tag) ? ts.filter((x) => x !== tag) : [...ts, tag]))} />
                ))}
              </View>
              <View style={{ flexDirection: 'row', gap: spacing.md, marginTop: spacing.xl }}>
                <PrimaryButton label={t('common.cancel')} onPress={() => setForm(false)} style={{ flex: 1, backgroundColor: colors.textMuted }} />
                <PrimaryButton testID="post-publish" label={t('common.publish')} icon="send" onPress={publish} loading={create.isPending} style={{ flex: 1 }} />
              </View>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.black },
  top: { position: 'absolute', top: 0, left: 0, right: 0, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.lg },
  demo: { flex: 1, textAlign: 'center', color: colors.navy, fontFamily: fonts.medium, fontSize: 10, marginHorizontal: spacing.sm },
  avatar: { position: 'absolute', left: 0, bottom: 130 },
  plus: { position: 'absolute', alignSelf: 'center', left: '50%', marginLeft: -28, width: 56, height: 56, borderRadius: 28, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center', borderWidth: 3, borderColor: colors.white },
  picker: { position: 'absolute', left: spacing.lg, right: spacing.lg, backgroundColor: 'rgba(255,255,255,0.96)', borderRadius: radius.lg, padding: spacing.md, gap: spacing.sm },
  pickerTitle: { fontFamily: fonts.semibold, color: colors.text },
  pickerHint: { fontFamily: fonts.regular, fontSize: 10, color: colors.textMuted },
  pickItem: { padding: 4, borderRadius: radius.md, borderWidth: 2, borderColor: 'transparent', minWidth: 44, minHeight: 74, alignItems: 'center', justifyContent: 'center' },
  pickOn: { borderColor: colors.primary },
  toolbar: { position: 'absolute', left: 0, right: 0, bottom: 0, backgroundColor: colors.primary },
  sheetWrap: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.35)' },
  sheet: { backgroundColor: colors.white, borderTopLeftRadius: radius.xl, borderTopRightRadius: radius.xl, padding: spacing.lg, maxHeight: '85%' },
  sheetTitle: { fontFamily: fonts.semibold, fontSize: fontSize.lg, color: colors.text, marginBottom: spacing.md },
  input: { borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, fontFamily: fonts.regular, fontSize: fontSize.md, marginBottom: spacing.sm, minHeight: 44 },
  label: { fontFamily: fonts.semibold, fontSize: fontSize.sm, marginTop: spacing.md, marginBottom: spacing.sm, color: colors.text },
  chips: { flexDirection: 'row', gap: spacing.sm },
  courseName: { fontFamily: fonts.regular, fontSize: fontSize.xs, color: colors.textMuted, marginTop: 4 },
});
