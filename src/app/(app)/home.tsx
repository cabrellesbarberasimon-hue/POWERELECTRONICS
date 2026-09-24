import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useI18n } from '@/i18n';
import { RecommendationList } from '@/modules/ai/RecommendationList';
import { Avatar, Chip, ModuleCard, Screen, SectionTitle, SideMenu } from '@/shared/components';
import { useUser } from '@/stores/session';
import { colors, fonts, fontSize, spacing } from '@/theme';

const Circle = ({ children }: { children: React.ReactNode }) => <View style={styles.circle}>{children}</View>;

/** Main menu with the three modules (Figure 1). */
export default function Home() {
  const { t } = useI18n();
  const user = useUser();
  const insets = useSafeAreaInsets();

  return (
    <View style={{ flex: 1 }}>
      <Screen
        header={
          <View style={[styles.header, { paddingTop: insets.top + spacing.md }]}>
            <Pressable onPress={() => router.push('/account')} accessibilityRole="button" accessibilityLabel={t('drawer.account')}>
              <Avatar user={user} size={40} ring />
            </Pressable>
            <View style={{ flex: 1 }}>
              <Text style={styles.hello}>{t('home.greeting', { name: user.name.split(' ')[0] })}</Text>
              <Text style={styles.role}>{t(`roles.${user.role}`)}</Text>
            </View>
            <Text style={styles.brand}>SENSE</Text>
          </View>
        }
      >
        <View style={styles.modules}>
          <ModuleCard
            testID="module-university"
            label={t('home.university')}
            onPress={() => router.push('/university')}
            icon={
              <Circle>
                <MaterialCommunityIcons name="school" size={46} color={colors.white} />
              </Circle>
            }
          />
          <ModuleCard
            testID="module-training"
            label={t('home.training')}
            onPress={() => router.push('/training')}
            icon={
              <Circle>
                <MaterialCommunityIcons name="scan-helper" size={40} color={colors.white} />
                <Ionicons name="add" size={26} color={colors.white} style={{ position: 'absolute' }} />
              </Circle>
            }
          />
          <ModuleCard
            testID="module-social"
            label={t('home.social')}
            onPress={() => router.push('/social')}
            icon={
              <Circle>
                <MaterialCommunityIcons
                  name="share-variant-outline"
                  size={44}
                  color={colors.white}
                  style={{ marginLeft: -8, marginTop: -8 }}
                />
                <MaterialCommunityIcons
                  name="account-circle"
                  size={30}
                  color={colors.white}
                  style={{ position: 'absolute', right: 14, bottom: 12 }}
                />
              </Circle>
            }
          />
        </View>

        {(user.role === 'admin' || user.role === 'instructor') && (
          <View style={styles.shortcuts}>
            <Chip icon="star" label={t('home.evaluator')} onPress={() => router.push('/admin/review')} />
            {user.role === 'admin' && <Chip icon="settings" label={t('home.admin')} onPress={() => router.push('/admin')} />}
          </View>
        )}

        <SectionTitle>{t('home.recommended')}</SectionTitle>
        <Text style={styles.hint}>{t('home.recommendedHint')}</Text>
        <RecommendationList />
      </Screen>
      <SideMenu top="45%" />
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    backgroundColor: colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
  },
  hello: { color: colors.white, fontFamily: fonts.semibold, fontSize: fontSize.lg },
  role: { color: 'rgba(255,255,255,0.85)', fontFamily: fonts.regular, fontSize: fontSize.xs },
  brand: { color: colors.white, fontFamily: fonts.bold, fontSize: fontSize.lg, letterSpacing: 1 },
  modules: { gap: spacing.lg },
  circle: { width: 84, height: 84, borderRadius: 42, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  shortcuts: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.lg, flexWrap: 'wrap' },
  hint: { fontFamily: fonts.regular, fontSize: fontSize.xs, color: colors.textMuted, marginTop: -4 },
});
