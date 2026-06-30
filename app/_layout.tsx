import { useFonts } from 'expo-font';
import * as Notifications from 'expo-notifications';
import { router, Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, type ComponentType } from 'react';
import { getGroup } from '../src/api/generated/group/group';
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

  // hideAsync()는 SplashScreen 컴포넌트(app/index.tsx)에서 호출한다.
  // app/index.tsx는 항상 초기 라우트로 마운트되므로 여기서 호출할 필요가 없다.

  useEffect(() => {
    initAnalytics();
    initAirbridge();
  }, []);

  // FCM registration token 갱신 감지 → 서버에 새 토큰 재등록
  useEffect(() => {
    return subscribeToDevicePushTokenRefresh();
  }, []);

  // 푸시 알림 탭 시 그룹 여부에 따라 라우팅
  useEffect(() => {
    const subscription = Notifications.addNotificationResponseReceivedListener(async () => {
      try {
        const groups = await getGroup().getMyGroups();
        if (groups.length === 0) {
          router.push('/(group)/home');
        } else {
          router.push('/(group)/notifications');
        }
      } catch {
        // 미로그인 등 API 실패 시 앱 자체 인증 흐름에 위임
      }
    });
    return () => subscription.remove();
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
