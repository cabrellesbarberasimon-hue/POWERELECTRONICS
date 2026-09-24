import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Animated, Pressable, StyleSheet, Text } from 'react-native';
import { useI18n } from '@/i18n';
import { SenseLogo } from '@/shared/components';
import { useSession } from '@/stores/session';
import { colors, fonts, spacing } from '@/theme';

/** Blue splash screen: "SENSE — By Power Electrónics" (Figure 0). */
export default function Splash() {
  const { t } = useI18n();
  const user = useSession((s) => s.user);
  const [fade] = useState(() => new Animated.Value(0));

  const next = () => router.replace(user ? '/home' : '/login');

  useEffect(() => {
    Animated.timing(fade, { toValue: 1, duration: 700, useNativeDriver: true }).start();
    const id = setTimeout(next, 1800);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Pressable style={styles.root} onPress={next} accessibilityLabel="SENSE">
      <Animated.View style={{ opacity: fade, transform: [{ scale: fade.interpolate({ inputRange: [0, 1], outputRange: [0.92, 1] }) }] }}>
        <SenseLogo subtitle={t('common.byPE')} />
      </Animated.View>
      <Animated.Text style={[styles.tagline, { opacity: fade }]}>{t('common.tagline')}</Animated.Text>
      <Text style={styles.version}>Beta prototype · v0.1</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center', padding: spacing.xl },
  tagline: {
    position: 'absolute',
    bottom: 90,
    left: spacing.xl,
    right: spacing.xl,
    color: colors.white,
    fontFamily: fonts.medium,
    textAlign: 'center',
    fontSize: 15,
    opacity: 0.9,
  },
  version: { position: 'absolute', bottom: 40, color: 'rgba(255,255,255,0.7)', fontFamily: fonts.regular, fontSize: 11 },
});
