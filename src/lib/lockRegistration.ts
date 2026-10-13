import * as ReactNativeDeviceActivity from 'react-native-device-activity';

import { cancelRelockWarning } from './relockWarning';
import { startDailyUsageMonitoring } from './screenTimeMonitoring';
import { registerAppShield, unregisterAppShield } from './shieldConfig';

/**
 * 등록된 앱 하나의 실제 잠금을 푼다: 차단 해제, 잠깐 해제 중이라 남아 있을 수 있는 화이트리스트
 * 정리, 앱별 쉴드 설정 제거. 화면 목록(store)에서 빼는 건 호출부가 unregisterApp으로 한다.
 */
export const releaseAppLock = (appId: string, token: string) => {
  ReactNativeDeviceActivity.unblockSelection({ activitySelectionToken: token }, 'app-unregistered');
  ReactNativeDeviceActivity.removeSelectionFromWhitelistAndUpdateBlock(
    { activitySelectionToken: token },
    'app-unregistered'
  );
  unregisterAppShield(appId);
  // 해제 중이라 예약해 둔 "곧 다시 잠겨요" 알림이 남아 있으면 같이 취소한다.
  cancelRelockWarning(appId);
};

/**
 * 앱(또는 카테고리 묶음) 하나의 실제 잠금을 건다: 차단, 화이트리스트 정리, 앱별 쉴드 설정,
 * 일일 사용량 모니터링 시작. 화면 목록(store)에 넣는 건 호출부가 registerAppSelection으로 한다.
 */
export const lockApp = (appId: string, token: string) => {
  ReactNativeDeviceActivity.blockSelection({ activitySelectionToken: token }, 'app-registered');
  // 예전에 "잠깐 해제"로 화이트리스트에 들어간 채 남아있으면(재잠금이 실패했거나, 해제 후
  // 등록 해제했다가 다시 추가한 경우) 화이트리스트가 차단보다 우선해서 앱이 안 잠긴다.
  ReactNativeDeviceActivity.removeSelectionFromWhitelistAndUpdateBlock(
    { activitySelectionToken: token },
    'app-registered'
  );
  // 이 앱의 해제 요청이 어떤 앱인지 쉴드가 알도록 앱별 쉴드 설정을 등록한다.
  registerAppShield(appId, token);
  // 최근 7일 평균 계산용 — 등록 즉시 오늘부터 일일 임계값 모니터링을 시작한다.
  startDailyUsageMonitoring(appId, token).catch(() => undefined);
};
