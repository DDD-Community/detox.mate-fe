import { QueryProvider } from '../src/lib/query/QueryProvider';
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
import { logError, normalizeError } from '../src/api/errors';

if (__DEV__ && process.env.EXPO_PUBLIC_MSW_ENABLED === 'true') {
  // Load native polyfills and install interception before mounting any routes.
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  require('../src/mocks/native').startNativeMocking();
}

initSentry();
SplashScreen.preventAutoHideAsync();

const STORYBOOK_ENABLED = process.env.EXPO_PUBLIC_STORYBOOK === 'true';
const StorybookUIRoot = STORYBOOK_ENABLED
  ? (require('../.storybook').default as ComponentType)
  : undefined;

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts(fontSources);

  useEffect(() => {
    initAnalytics();
  }, []);

  useEffect(() => {
    // SDK에 캐시된 초대가 즉시 전달될 수 있으므로 Stack이 준비된 뒤 구독한다.
    if (!fontsLoaded && !fontError) return;
    // 딥링크는 index를 거치지 않을 수도 있으므로 네이티브 스플래시 종료는 루트에서 맡는다.
    void SplashScreen.hideAsync().catch((error) => {
      logError(normalizeError(error), { scope: 'app.bootstrap', operation: 'hideNativeSplash' });
    });
    initAirbridge();
  }, [fontsLoaded, fontError]);

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
    return (
      <QueryProvider>
        <StorybookUIRoot />
      </QueryProvider>
    );
  }

  return (
    <QueryProvider>
      <AppErrorBoundary>
        <Stack screenOptions={{ headerShown: false }} />
      </AppErrorBoundary>
      <NetworkErrorToast />
    </QueryProvider>
  );
}
