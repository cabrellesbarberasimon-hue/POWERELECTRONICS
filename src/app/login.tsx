import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';
import { useI18n } from '@/i18n';
import { authenticateBiometric, biometricsAvailable } from '@/modules/auth/biometrics';
import { api } from '@/services';
import { Chip, NavyButton, toast } from '@/shared/components';
import { useSession } from '@/stores/session';
import { colors, fonts, fontSize, radius, spacing } from '@/theme';

const DEMO = ['trainee', 'technician', 'instructor', 'admin'] as const;

/** Sign In screen (Figure 0): fingerprint frame, username, password, navy "Log in". */
export default function Login() {
  const { t, locale, setLocale } = useI18n();
  const insets = useSafeAreaInsets();
  const { signIn, biometricUsername, setLocale: persistLocale } = useSession();
  const [username, setUsername] = useState(biometricUsername ?? '');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [bioAvailable, setBioAvailable] = useState(false);

  useEffect(() => {
    biometricsAvailable().then(setBioAvailable);
  }, []);

  const submit = async (u = username, p = password) => {
    setLoading(true);
    setError(null);
    try {
      const user = await api.auth.signIn(u, p);
      signIn(user);
      router.replace('/home');
    } catch {
      setError(t('auth.invalid'));
    } finally {
      setLoading(false);
    }
  };

  const biometric = async () => {
    if (!bioAvailable) return toast(t('auth.biometricUnavailable'));
    if (!biometricUsername) return toast(t('auth.biometricNeedsLogin'));
    if (!(await authenticateBiometric(t('auth.biometricPrompt')))) return;
    // In production the biometric check unlocks a refresh token kept in SecureStore.
    const user = (await api.auth.listUsers()).find((u) => u.username === biometricUsername);
    if (user) {
      signIn(user);
      router.replace('/home');
    }
  };

  const switchLocale = () => {
    const next = locale === 'en' ? 'es' : 'en';
    setLocale(next);
    persistLocale(next);
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: colors.white }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView
        contentContainerStyle={[styles.root, { paddingTop: insets.top + spacing.lg, paddingBottom: insets.bottom + spacing.xl }]}
        keyboardShouldPersistTaps="handled"
      >
        <Pressable onPress={switchLocale} style={styles.lang} accessibilityRole="button" accessibilityLabel={t('common.language')}>
          <Text style={styles.langText}>{locale === 'en' ? 'ES' : 'EN'}</Text>
        </Pressable>

        <Pressable onPress={biometric} accessibilityRole="button" accessibilityLabel={t('auth.biometric')} style={styles.finger}>
          <Svg width={150} height={150} viewBox="0 0 150 150" style={StyleSheet.absoluteFill}>
            {[
              'M8 45 V16 Q8 8 16 8 H45',
              'M105 8 H134 Q142 8 142 16 V45',
              'M142 105 V134 Q142 142 134 142 H105',
              'M45 142 H16 Q8 142 8 134 V105',
            ].map((d) => (
              <Path key={d} d={d} stroke={colors.primary} strokeWidth={9} strokeLinecap="round" fill="none" />
            ))}
          </Svg>
          <MaterialCommunityIcons name="fingerprint" size={96} color={colors.primary} />
        </Pressable>
        <Text style={styles.bioHint}>{t('auth.biometric')}</Text>

        <Text style={styles.title} accessibilityRole="header">
          {t('auth.signIn')}
        </Text>

        <View style={styles.form}>
          <Text style={styles.label}>{t('auth.username')}</Text>
          <TextInput
            testID="username"
            value={username}
            onChangeText={setUsername}
            autoCapitalize="none"
            autoCorrect={false}
            style={styles.input}
            accessibilityLabel={t('auth.username')}
          />
          <Text style={styles.label}>{t('auth.password')}</Text>
          <TextInput
            testID="password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            style={styles.input}
            onSubmitEditing={() => submit()}
            accessibilityLabel={t('auth.password')}
          />
          {error && <Text style={styles.error}>{error}</Text>}
          <NavyButton testID="login" label={t('auth.logIn')} onPress={() => submit()} loading={loading} style={styles.button} />
        </View>

        <Text style={styles.demoTitle}>{t('auth.demoAccounts')}</Text>
        <View style={styles.demo}>
          {DEMO.map((u) => (
            <Chip
              key={u}
              label={u}
              icon="person-circle-outline"
              active={username === u}
              onPress={() => {
                setUsername(u);
                setPassword('sense');
                submit(u, 'sense');
              }}
            />
          ))}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { alignItems: 'center', paddingHorizontal: spacing.xl },
  lang: {
    alignSelf: 'flex-end',
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: radius.pill,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  langText: { color: colors.primary, fontFamily: fonts.semibold, fontSize: fontSize.sm },
  finger: { width: 150, height: 150, alignItems: 'center', justifyContent: 'center', marginTop: spacing.lg },
  bioHint: { color: colors.textMuted, fontFamily: fonts.regular, fontSize: fontSize.xs, marginTop: spacing.sm },
  title: { color: colors.primary, fontFamily: fonts.semibold, fontSize: 34, marginTop: spacing.lg },
  form: { alignSelf: 'stretch', maxWidth: 420, width: '100%', marginTop: spacing.md },
  label: { fontFamily: fonts.semibold, fontSize: fontSize.lg, color: '#4B4B4B', marginTop: spacing.md, marginBottom: 4 },
  input: {
    borderWidth: 1.5,
    borderColor: '#B8B8B8',
    height: 48,
    paddingHorizontal: spacing.md,
    fontFamily: fonts.regular,
    fontSize: fontSize.md,
    color: colors.text,
  },
  error: { color: colors.red, fontFamily: fonts.medium, marginTop: spacing.sm },
  button: { alignSelf: 'center', minWidth: 180, marginTop: spacing.xl },
  demoTitle: { marginTop: spacing.xxl, color: colors.textMuted, fontFamily: fonts.medium, fontSize: fontSize.xs },
  demo: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: spacing.sm, marginTop: spacing.sm },
});
