import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, type ComponentType } from 'react';
import { fontSources } from '../src/lib/token/primitive/fonts';
import { NetworkErrorToast } from '../src/components/NetworkErrorToast';
import { subscribeToDevicePushTokenRefresh } from '../src/lib/fcmToken';
import { AppErrorBoundary } from '../src/components/AppErrorBoundary';
import { initSentry } from '../src/observability/sentry';
import { initAirbridge } from '../src/lib/airbridge';
import { initAnalytics } from '../src/lib/analytics';

initSentry();
SplashScreen.preventAutoHideAsync();

const STORYBOOK_ENABLED = process.env.EXPO_PUBLIC_STORYBOOK === 'true';
const StorybookUIRoot = STORYBOOK_ENABLED
  ? (require('../.storybook').default as ComponentType)
  : undefined;

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts(fontSources);

  // 딥링크 등으로 SplashScreen을 거치지 않을 때를 위한 폴백.
  // 정상 경로에서는 SplashScreen 컴포넌트 mount 시 먼저 호출되므로,
  // 여기서 즉시 호출하면 네이티브→React 전환이 노출된다.
  // setTimeout으로 한 프레임 뒤에 호출해 SplashScreen의 hideAsync()에 우선순위를 양보한다.
  useEffect(() => {
    if (!(fontsLoaded || fontError)) return;
    const timer = setTimeout(() => SplashScreen.hideAsync(), 200);
    return () => clearTimeout(timer);
  }, [fontsLoaded, fontError]);

  useEffect(() => {
    initAnalytics();
    initAirbridge();
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
      <AppErrorBoundary>
        <Stack screenOptions={{ headerShown: false }} />
      </AppErrorBoundary>
      <NetworkErrorToast />
    </>
  );
}
