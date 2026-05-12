import { Stack } from 'expo-router';

export default function VerifyLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        presentation: 'transparentModal',
        animation: 'slide_from_bottom',
        contentStyle: { backgroundColor: 'transparent' },
      }}
    >
      <Stack.Screen name="index" options={{ animation: 'fade' }} />
      <Stack.Screen name="retro" options={{ presentation: 'card', animation: 'default' }} />
    </Stack>
  );
}
