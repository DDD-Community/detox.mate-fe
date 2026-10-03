import { useFonts } from 'expo-font';
import * as Notifications from 'expo-notifications';
import { router, Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, type ComponentType } from 'react';
import * as ReactNativeDeviceActivity from 'react-native-device-activity';
import { getGroup } from '../src/api/generated/group/group';
import { SHIELD_ACTIONS, SHIELD_CONFIGURATION } from '../src/lib/shieldConfig';
import { APP_UNLOCK_REQUEST_NOTIFICATION_TYPE } from '../src/lib/notificationTypes';
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
    // 쉴드 문구/버튼 설정은 전역이라, 언제 앱을 등록했든 항상 최신 상태가 적용되도록
    // 앱 실행 시마다 다시 밀어넣는다.
    ReactNativeDeviceActivity.updateShield(SHIELD_CONFIGURATION, SHIELD_ACTIONS, 'app-launch');
  }, []);

  // FCM registration token 갱신 감지 → 서버에 새 토큰 재등록
  useEffect(() => {
    return subscribeToDevicePushTokenRefresh();
  }, []);

  // 푸시 알림 탭 시 라우팅. 앱 잠금 해제 요청 알림이면 타이머 화면으로,
  // 그 외에는 기존처럼 그룹 여부에 따라 라우팅한다.
  useEffect(() => {
    const subscription = Notifications.addNotificationResponseReceivedListener(async (response) => {
      const data = response.notification.request.content.data as
        | Record<string, unknown>
        | undefined;
      if (data?.type === APP_UNLOCK_REQUEST_NOTIFICATION_TYPE) {
        router.push('/(lock)/unlock-timer');
        return;
      }

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
