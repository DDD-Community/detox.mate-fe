import * as SecureStore from 'expo-secure-store';
import * as ReactNativeDeviceActivity from 'react-native-device-activity';

import { clearVerifyHowToHidden } from '../features/verify-how-to/howToPreference';
import { resetAnalyticsUser } from './analytics';
import { releaseAppLock } from './lockRegistration';
import { discardPendingInvite } from './pendingInvite';
import { clearAllScreenTimeHistory } from './screenTimeHistory';
import { buildUsageActivityName } from './screenTimeMonitoring';
import { clearSharedDisplayConfig } from './sharedDisplayConfig';
import { useLockStore } from '../stores/lockStore';

// 하나가 실패해도 나머지는 지운다 — 탈퇴는 이미 서버에서 끝난 뒤라 중간에 멈추면 더 어정쩡해진다.
const attempt = async (task: () => unknown) => {
  try {
    await task();
  } catch {
    // best-effort
  }
};

/**
 * 회원 탈퇴 후 기기에 남은 이 계정의 흔적을 지운다.
 * 잠금 토큰이 lockStore에만 있어서, store를 비우기 전에 OS 차단부터 풀어야 한다.
 * currentUserId에 기대는 값(인증 방법 숨김)이 있으니 clearAuthSession보다 먼저 호출한다.
 */
export const clearLocalUserData = async () => {
  const { lockedApps, familyActivitySelectionsByAppId } = useLockStore.getState();

  for (const app of lockedApps) {
    const token = familyActivitySelectionsByAppId[app.id];
    if (token) await attempt(() => releaseAppLock(app.id, token));
  }
  await attempt(() =>
    ReactNativeDeviceActivity.stopMonitoring(
      lockedApps.map((app) => buildUsageActivityName(app.id))
    )
  );

  await attempt(clearSharedDisplayConfig);
  await attempt(() => {
    useLockStore.setState({
      selectedAppIds: [],
      targetMinutes: null,
      lockedApps: [],
      familyActivitySelectionsByAppId: {},
    });
    return useLockStore.persist.clearStorage();
  });
  await attempt(clearAllScreenTimeHistory);

  await attempt(clearVerifyHowToHidden);
  await attempt(discardPendingInvite);
  await attempt(() => SecureStore.deleteItemAsync('needsGoalReset'));

  await attempt(resetAnalyticsUser);
};
