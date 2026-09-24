import { Redirect, Stack } from 'expo-router';
import { useSession } from '@/stores/session';

/** Admin area: instructors (evaluators) and administrators only. */
export default function AdminLayout() {
  const role = useSession((s) => s.user?.role);
  if (role !== 'admin' && role !== 'instructor') return <Redirect href="/home" />;
  return <Stack screenOptions={{ headerShown: false }} />;
}
