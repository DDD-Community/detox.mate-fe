import { useFonts } from 'expo-font';
import * as Notifications from 'expo-notifications';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { fontSources } from '../src/lib/token/primitive/fonts';
import { NetworkErrorToast } from '../src/components/NetworkErrorToast';
import { handleNewDevicePushToken } from '../src/lib/fcmToken';

import StorybookUIRoot from '../.storybook';

SplashScreen.preventAutoHideAsync();

const STORYBOOK_ENABLED = process.env.EXPO_PUBLIC_STORYBOOK === 'true';

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts(fontSources);

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  // FCM 디바이스 토큰 갱신 감지 → 서버에 새 토큰 재등록
  useEffect(() => {
    const sub = Notifications.addPushTokenListener((tokenResponse) => {
      const token = typeof tokenResponse?.data === 'string' ? tokenResponse.data : undefined;
      if (!token) return;
      handleNewDevicePushToken(token).catch(() => {
        // 갱신 실패는 다음 갱신 또는 SettingsScreen 진입 시점에 재시도됨
      });
    });
    return () => sub.remove();
  }, []);

  if (!fontsLoaded && !fontError) return null;

  if (STORYBOOK_ENABLED) {
    return <StorybookUIRoot />;
  }

  return (
    <>
      <Stack screenOptions={{ headerShown: false }} />
      <NetworkErrorToast />
    </>
  );
}
