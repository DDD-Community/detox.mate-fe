import { useFonts } from 'expo-font';
import * as Notifications from 'expo-notifications';
import { router, Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, type ComponentType } from 'react';
import * as ReactNativeDeviceActivity from 'react-native-device-activity';
import { getGroup } from '../src/api/generated/group/group';
import {
  ensureShieldIcon,
  registerAppShield,
  SHIELD_ACTIONS,
  SHIELD_CONFIGURATION,
} from '../src/lib/shieldConfig';
import { APP_UNLOCK_REQUEST_NOTIFICATION_TYPE } from '../src/lib/notificationTypes';
import { ensureDailyUsageMonitoring } from '../src/lib/screenTimeMonitoring';
import { syncScreenTimeHistory } from '../src/lib/screenTimeHistory';
import { syncTimeLimitFromServer } from '../src/lib/timeLimitSync';
import { syncTargetMinutes } from '../src/lib/sharedDisplayConfig';
import { useLockStore } from '../src/stores/lockStore';
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
    ensureShieldIcon().finally(() => {
      ReactNativeDeviceActivity.updateShield(SHIELD_CONFIGURATION, SHIELD_ACTIONS, 'app-launch');
    });

    // 최근 7일 평균 계산용 일일 사용량 모니터링을 보장하고, 어제까지의 기록을 로컬에 반영한다.
    const { lockedApps, familyActivitySelectionsByAppId, targetMinutes } = useLockStore.getState();
    syncTargetMinutes(targetMinutes);
    // 앱별 쉴드 설정(어떤 앱의 해제 요청인지 알림에 담기)도 이미 등록된 앱 전부에 다시 보장한다.
    for (const app of lockedApps) {
      const token = familyActivitySelectionsByAppId[app.id];
      if (token) registerAppShield(app.id, token);
    }
    ensureDailyUsageMonitoring(lockedApps, familyActivitySelectionsByAppId);
    syncScreenTimeHistory(lockedApps.map((app) => app.id));
    // 서버에 저장된 제한 시간을 불러와 로컬 값에 반영한다(없거나 실패하면 로컬 값 유지).
    syncTimeLimitFromServer();
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
        // 어떤 앱의 해제 요청인지는 앱별 쉴드 설정이 userInfo에 심어둔 appId로 안다(shieldConfig.ts).
        const appId = typeof data.appId === 'string' ? data.appId : undefined;
        router.push({
          pathname: '/(lock)/unlock-timer',
          params: appId ? { appId } : {},
        });
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
