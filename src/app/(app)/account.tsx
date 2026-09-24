import { useQueryClient } from '@tanstack/react-query';
import { router } from 'expo-router';
import { StyleSheet, Switch, Text, View } from 'react-native';
import { useContribution } from '@/hooks/api';
import { useI18n } from '@/i18n';
import { api } from '@/services';
import { Avatar, Card, Chip, DangerButton, GhostButton, Header, OutlineButton, Screen, SectionTitle, toast } from '@/shared/components';
import { useSession, useUser } from '@/stores/session';
import { colors, fonts, fontSize, spacing } from '@/theme';

export default function Account() {
  const { t, locale, setLocale } = useI18n();
  const user = useUser();
  const { signOut, setLocale: persistLocale, biometricUsername, setBiometricUsername } = useSession();
  const contribution = useContribution(user.id);
  const qc = useQueryClient();

  const changeLocale = (l: 'en' | 'es') => {
    setLocale(l);
    persistLocale(l);
  };

  const rows: [string, string][] = [
    [t('account.role'), t(`roles.${user.role}`)],
    [t('account.department'), user.department],
    [t('account.country'), user.country],
  ];

  return (
    <Screen header={<Header title={t('account.title')} />}>
      <View style={styles.profile}>
        <Avatar user={user} size={84} />
        <Text style={styles.name}>{user.name}</Text>
        <Text style={styles.username}>@{user.username}</Text>
      </View>

      <Card>
        {rows.map(([k, v]) => (
          <View key={k} style={styles.row}>
            <Text style={styles.key}>{k}</Text>
            <Text style={styles.value}>{v}</Text>
          </View>
        ))}
        <View style={styles.row}>
          <Text style={styles.key}>{t('account.biometrics')}</Text>
          <Switch
            value={biometricUsername === user.username}
            onValueChange={(on) => setBiometricUsername(on ? user.username : null)}
            trackColor={{ true: colors.primary }}
          />
        </View>
      </Card>

      <SectionTitle>{t('common.language')}</SectionTitle>
      <View style={{ flexDirection: 'row', gap: spacing.sm }}>
        <Chip label={t('common.english')} active={locale === 'en'} onPress={() => changeLocale('en')} />
        <Chip label={t('common.spanish')} active={locale === 'es'} onPress={() => changeLocale('es')} />
      </View>

      <SectionTitle>{t('account.contribution')}</SectionTitle>
      <Card onPress={() => router.push({ pathname: '/social/profile/[id]', params: { id: user.id } })}>
        <Text style={styles.points}>{t('common.points', { count: contribution.data?.points ?? 0 })}</Text>
        <Text style={styles.key}>
          {contribution.data?.posts ?? 0} {t('social.postsLabel').toLowerCase()} · {contribution.data?.challengesCompleted ?? 0}{' '}
          {t('social.challengesLabel').toLowerCase()} · {contribution.data?.stepsCompleted ?? 0} {t('social.lessonsLabel').toLowerCase()}
        </Text>
      </Card>

      <View style={{ gap: spacing.md, marginTop: spacing.xxl }}>
        <OutlineButton label={t('drawer.certificates')} icon="school" onPress={() => router.push('/certificates')} />
        <GhostButton
          label={t('account.resetDemo')}
          icon="refresh"
          onPress={async () => {
            await api.admin.resetDemoData();
            await qc.invalidateQueries();
            toast(t('account.resetDone'), 'success');
          }}
        />
        <DangerButton
          label={t('common.signOut')}
          icon="log-out-outline"
          onPress={() => {
            signOut();
            router.replace('/login');
          }}
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  profile: { alignItems: 'center', gap: 4, marginBottom: spacing.lg },
  name: { fontFamily: fonts.semibold, fontSize: fontSize.xl, color: colors.text, marginTop: spacing.sm },
  username: { fontFamily: fonts.regular, color: colors.textMuted },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: spacing.sm },
  key: { fontFamily: fonts.regular, color: colors.textMuted, fontSize: fontSize.sm },
  value: { fontFamily: fonts.medium, color: colors.text, fontSize: fontSize.sm },
  points: { fontFamily: fonts.bold, fontSize: fontSize.xl, color: colors.primary },
});
