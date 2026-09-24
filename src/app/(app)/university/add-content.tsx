import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useI18n } from '@/i18n';
import { ModuleCard, SideMenu } from '@/shared/components';
import { colors, fonts, spacing } from '@/theme';

/** "Add Content" (Figure 2): Moodle Content / Post Content. */
export default function AddContent() {
  const { courseId, sectionId } = useLocalSearchParams<{ courseId?: string; sectionId?: string }>();
  const { t } = useI18n();
  const insets = useSafeAreaInsets();
  const params = { courseId: courseId ?? '', sectionId: sectionId ?? '' };

  return (
    <View style={[styles.root, { paddingTop: insets.top + spacing.md, paddingBottom: insets.bottom + spacing.lg }]}>
      <View style={styles.bar}>
        <Pressable onPress={() => router.back()} accessibilityRole="button" accessibilityLabel={t('common.back')}>
          <Ionicons name="arrow-undo" size={34} color={colors.primary} />
        </Pressable>
        <Text style={styles.title}>{t('university.addContent')}</Text>
        <Ionicons name="checkmark" size={38} color={colors.primary} />
      </View>
      <View style={styles.cards}>
        <ModuleCard
          testID="add-moodle"
          style={{ flex: 1 }}
          label={t('university.moodleContent')}
          onPress={() => router.replace({ pathname: '/university/moodle', params })}
          icon={
            <View style={styles.circle}>
              <MaterialCommunityIcons name="file-document-edit-outline" size={56} color={colors.white} />
            </View>
          }
        />
        <ModuleCard
          testID="add-post"
          style={{ flex: 1 }}
          label={t('university.postContent')}
          onPress={() => router.replace({ pathname: '/create-post', params })}
          icon={
            <View style={styles.circle}>
              <MaterialCommunityIcons name="file-document-outline" size={56} color={colors.white} />
            </View>
          }
        />
      </View>
      <SideMenu top="45%" />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.white, paddingHorizontal: spacing.xl },
  bar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  title: { fontFamily: fonts.semibold, fontSize: 16, color: colors.textMuted },
  cards: { flex: 1, gap: spacing.xl, paddingVertical: spacing.xxl },
  circle: { width: 110, height: 110, borderRadius: 55, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
});
