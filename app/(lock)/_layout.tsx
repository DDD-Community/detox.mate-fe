import { AuthGuard } from '@/components/AuthGuard/AuthGuard';
import { Stack } from 'expo-router';

export default function LockLayout() {
  return (
    <AuthGuard>
      <Stack screenOptions={{ headerShown: false }} />
    </AuthGuard>
  );
}
