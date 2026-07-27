import { Stack } from 'expo-router';

export default function FeedLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen
        name="verify"
        options={{
          presentation: 'transparentModal',
          animation: 'fade',
          contentStyle: { backgroundColor: 'transparent' },
        }}
      />
    </Stack>
  );
}
