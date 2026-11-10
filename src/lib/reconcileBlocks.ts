import * as ReactNativeDeviceActivity from 'react-native-device-activity';

import { useLockStore } from '../stores/lockStore';
import { unionTokens } from './familyActivitySelections';

const reconcile = () => {
  const tokens = Object.values(useLockStore.getState().familyActivitySelectionsByAppId);
  try {
    // 차단 목록은 앱 그룹에 따로 저장돼서, 등록 목록(lockStore)이 비워져도 OS 차단은 남는다.
    // 남은 앱은 제한 앱 목록에 없어 해제 알림에 appId가 없고, 탭하면 10초 타이머 대신 제한 앱 화면으로 간다.
    // 그래서 등록된 앱만 다시 차단하도록 목록을 통째로 맞춘다(잠깐 해제 중인 앱은 화이트리스트가 따로 지킨다).
    ReactNativeDeviceActivity.resetBlocks('reconcile-blocks');
    const registered = unionTokens(tokens);
    if (registered) {
      ReactNativeDeviceActivity.blockSelection(
        { activitySelectionToken: registered },
        'reconcile-blocks'
      );
    }
  } catch (error) {
    console.warn('[lock] 차단 목록 정리 실패', error);
  }
};

/**
 * 앱 실행 때 한 번, lockStore 복원이 끝난 뒤에 OS 차단 목록을 등록된 앱과 일치시킨다.
 * 복원 전(빈 목록)에 돌리면 정상 차단까지 풀어 버리므로 반드시 복원을 기다린다.
 */
export const reconcileBlocksWithRegisteredApps = () => {
  if (useLockStore.persist.hasHydrated()) {
    reconcile();
    return () => {};
  }
  return useLockStore.persist.onFinishHydration(reconcile);
};
