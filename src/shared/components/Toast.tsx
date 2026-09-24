import { useEffect, useState } from 'react';
import { Animated, StyleSheet, Text } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { create } from 'zustand';
import { colors, fonts, fontSize, radius, spacing } from '@/theme';

interface ToastState {
  message: string | null;
  tone: 'info' | 'success' | 'error';
  id: number;
  show: (message: string, tone?: ToastState['tone']) => void;
}

export const useToast = create<ToastState>((set) => ({
  message: null,
  tone: 'info',
  id: 0,
  show: (message, tone = 'info') => set((s) => ({ message, tone, id: s.id + 1 })),
}));

export const toast = (message: string, tone?: ToastState['tone']) => useToast.getState().show(message, tone);

/** Global toast host mounted once in the root layout. */
export function ToastHost() {
  const { message, tone, id } = useToast();
  const [opacity] = useState(() => new Animated.Value(0));
  const insets = useSafeAreaInsets();

  useEffect(() => {
    if (!message) return;
    opacity.setValue(0);
    Animated.sequence([
      Animated.timing(opacity, { toValue: 1, duration: 180, useNativeDriver: true }),
      Animated.delay(2200),
      Animated.timing(opacity, { toValue: 0, duration: 250, useNativeDriver: true }),
    ]).start();
  }, [id, message, opacity]);

  if (!message) return null;
  const bg = tone === 'success' ? colors.green : tone === 'error' ? colors.red : colors.navy;
  return (
    <Animated.View pointerEvents="none" style={[styles.toast, { bottom: insets.bottom + 90, backgroundColor: bg, opacity }]}>
      <Text style={styles.text}>{message}</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  toast: {
    position: 'absolute',
    left: spacing.xl,
    right: spacing.xl,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    zIndex: 1000,
    elevation: 10,
  },
  text: { color: colors.white, fontFamily: fonts.medium, fontSize: fontSize.sm, textAlign: 'center' },
});
