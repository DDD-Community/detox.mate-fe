import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, type ComponentType } from 'react';
import { fontSources } from '../src/lib/token/primitive/fonts';
import { NetworkErrorToast } from '../src/components/NetworkErrorToast';
import { subscribeToDevicePushTokenRefresh } from '../src/lib/fcmToken';
import { initAirbridge } from '../src/lib/airbridge';
import { initAnalytics, trackEvent } from '../src/lib/analytics';

SplashScreen.preventAutoHideAsync();

const STORYBOOK_ENABLED = process.env.EXPO_PUBLIC_STORYBOOK === 'true';
const StorybookUIRoot = STORYBOOK_ENABLED
  ? (require('../.storybook').default as ComponentType)
  : undefined;

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts(fontSources);

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  useEffect(() => {
    initAirbridge();
  }, []);

  useEffect(() => {
    initAnalytics()
      .then(() => {
        trackEvent('App Opened');
      })
      .catch(() => undefined);
  }, []);

  // FCM registration token 갱신 감지 → 서버에 새 토큰 재등록
  useEffect(() => {
    return subscribeToDevicePushTokenRefresh();
  }, []);

  if (!fontsLoaded && !fontError) return null;

  if (StorybookUIRoot) {
    return <StorybookUIRoot />;
  }

  return (
    <>
      <Stack screenOptions={{ headerShown: false }} />
      <NetworkErrorToast />
    </>
  );
}
