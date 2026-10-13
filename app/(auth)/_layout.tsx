import { Stack } from 'expo-router';
import { useAuthStatus } from '@/api/auth';

export default function AuthLayout() {
  const isSignedIn = useAuthStatus() === 'signedIn';
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="login" />
      <Stack.Protected guard={isSignedIn}>
        <Stack.Screen name="onboarding" />
        <Stack.Screen name="onboarding-apps" />
        <Stack.Screen name="onboarding-goal" />
        <Stack.Screen name="onboarding-invite" />
      </Stack.Protected>
    </Stack>
  );
}
