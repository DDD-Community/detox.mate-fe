import * as ReactNativeDeviceActivity from 'react-native-device-activity';
import type { Action, ShieldActions, ShieldConfiguration } from 'react-native-device-activity';
import { APP_UNLOCK_REQUEST_NOTIFICATION_TYPE } from './notificationTypes';

export const SHIELD_CONFIGURATION: ShieldConfiguration = {
  backgroundColor: { red: 0, green: 0, blue: 0 },
  title: '해제하면 친구에게 알림이 가요!\n지금 꼭 해제 해야하나요?',
  titleColor: { red: 255, green: 255, blue: 255 },
  // 피그마 기준 버튼 배치: 위(강조, 초록) = "아니요", 아래(중립, 회색 텍스트) = "지금 꼭 필요해요".
  primaryButtonLabel: '아니요, 안해도 괜찮아요',
  primaryButtonBackgroundColor: { red: 90, green: 137, blue: 116 }, // green[300]
  secondaryButtonLabel: '지금 꼭 필요해요',
  secondaryButtonLabelColor: { red: 56, green: 62, blue: 73 }, // gray[800]
};

// openUrl로 앱을 강제로 여는 건 이 라이브러리가 지원하지 않는다(ShieldActionType에 없음).
// 대신 쉴드가 직접 로컬 알림을 띄우고, 그 알림을 탭했을 때(app/_layout.tsx 리스너)
// unlock-timer로 이동하는 방식으로 우회한다.
const buildUnlockNotificationAction = (appId?: string): Action => ({
  type: 'sendNotification',
  payload: {
    title: 'Detox mate',
    body: '앱을 사용하려면, 이 알림을 클릭해주세요!',
    // userInfo는 쉴드 쪽에서 치환되지 않고 그대로 전달된다 — 앱별 설정에 appId를 고정해 넣는다.
    userInfo: { type: APP_UNLOCK_REQUEST_NOTIFICATION_TYPE, ...(appId ? { appId } : {}) },
  },
});

const buildShieldActions = (appId?: string): ShieldActions => ({
  // "아니요, 안해도 괜찮아요" → 그냥 닫기만 한다.
  primary: { behavior: 'close' },
  // "지금 꼭 필요해요" → 친구에게 알림을 보내고 닫는다.
  secondary: { behavior: 'close', actions: [buildUnlockNotificationAction(appId)] },
});

/** 어떤 앱인지 모를 때(앱별 설정이 없는 경우)의 기본 동작. */
export const SHIELD_ACTIONS: ShieldActions = buildShieldActions();

// 쉴드를 누른 앱이 어떤 등록 앱(appId)인지는, 쉴드 액션에서 앱 이름을 읽을 수 없어서(이름이
// 비어 와 "{applicationName}"이 글자 그대로 찍혔다) 토큰 기준으로 찾는다: 앱마다 선택 id를
// 등록하고, 그 id 전용 쉴드 액션(shieldActionsForSelection_<id>)을 따로 저장해두면 쉴드 액션이
// 눌린 앱의 토큰이 속한 id의 설정을 골라 쓴다. 이 id는 모니터링 이름(usage-<appId>)에
// 포함돼 있어야 매칭된다(screenTimeMonitoring.ts).
const SELECTION_IDS_KEY = 'familyActivitySelectionIds';
const SHIELD_ACTIONS_FOR_SELECTION_KEY = 'shieldActionsForSelection';

export const registerAppShield = (appId: string, token: string) => {
  ReactNativeDeviceActivity.setFamilyActivitySelectionId({
    id: appId,
    familyActivitySelection: token,
  });
  ReactNativeDeviceActivity.userDefaultsSet(
    `${SHIELD_ACTIONS_FOR_SELECTION_KEY}_${appId}`,
    buildShieldActions(appId)
  );
};

export const unregisterAppShield = (appId: string) => {
  ReactNativeDeviceActivity.userDefaultsRemove(`${SHIELD_ACTIONS_FOR_SELECTION_KEY}_${appId}`);
  const ids =
    ReactNativeDeviceActivity.userDefaultsGet<Record<string, string>>(SELECTION_IDS_KEY) ?? {};
  const rest = Object.fromEntries(Object.entries(ids).filter(([id]) => id !== appId));
  ReactNativeDeviceActivity.userDefaultsSet(SELECTION_IDS_KEY, rest);
};
