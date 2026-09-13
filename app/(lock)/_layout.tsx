import { Stack } from 'expo-router';

export default function LockLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="select-apps" options={{ presentation: 'fullScreenModal' }} />
    </Stack>
  );
}
