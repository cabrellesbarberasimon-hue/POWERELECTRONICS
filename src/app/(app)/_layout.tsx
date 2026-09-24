import { Redirect, Stack } from 'expo-router';
import { useSession } from '@/stores/session';
import { colors } from '@/theme';

/** Authenticated area: everything below requires a signed-in user. */
export default function AppLayout() {
  const user = useSession((s) => s.user);
  if (!user) return <Redirect href="/login" />;
  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.bg }, animation: 'slide_from_right' }}>
      <Stack.Screen name="social/post/[id]" options={{ presentation: 'modal', animation: 'slide_from_bottom' }} />
      <Stack.Screen name="create-post" options={{ animation: 'slide_from_bottom' }} />
      <Stack.Screen name="call/[userId]" options={{ animation: 'fade', gestureEnabled: false }} />
    </Stack>
  );
}
