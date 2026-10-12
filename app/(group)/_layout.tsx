import { AuthGuard } from '@/components/AuthGuard/AuthGuard';
import { Stack } from 'expo-router';

export default function GroupLayout() {
  return (
    <AuthGuard>
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
    </AuthGuard>
  );
}
