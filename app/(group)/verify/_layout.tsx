import { Stack } from 'expo-router';

export default function VerifyLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        presentation: 'transparentModal',
        animation: 'fade',
      }}
    >
      <Stack.Screen name="wrong-time" options={{ presentation: 'card', animation: 'default' }} />
      <Stack.Screen name="complete" options={{ presentation: 'card', animation: 'default' }} />
      <Stack.Screen name="retro" options={{ presentation: 'card', animation: 'default' }} />
      <Stack.Screen name="error" options={{ presentation: 'card', animation: 'default' }} />
    </Stack>
  );
}
