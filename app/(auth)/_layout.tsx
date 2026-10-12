import { Stack } from 'expo-router';
import { useAuthSessionStore } from '@/stores/authSessionStore';

export default function AuthLayout() {
  const isAuthenticated = useAuthSessionStore((state) => state.status === 'authenticated');
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="login" />
      <Stack.Protected guard={isAuthenticated}>
        <Stack.Screen name="onboarding" />
        <Stack.Screen name="onboarding-apps" />
        <Stack.Screen name="onboarding-goal" />
        <Stack.Screen name="onboarding-invite" />
      </Stack.Protected>
    </Stack>
  );
}
