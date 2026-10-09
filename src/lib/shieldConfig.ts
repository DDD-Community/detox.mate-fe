import SHIELD_ICON from '@assets/shield-turtle.png';
import { APP_UNLOCK_REQUEST_NOTIFICATION_TYPE } from './notificationTypes';
import { Asset } from 'expo-asset';
import type { Action, ShieldActions, ShieldConfiguration } from 'react-native-device-activity';
import * as ReactNativeDeviceActivity from 'react-native-device-activity';
import { UIBlurEffectStyle } from 'react-native-device-activity';

// 쉴드 아이콘 파일 이름. 쉴드 확장은 앱 그룹 폴더의 이미지만 읽을 수 있어서, 앱 실행 때
// ensureShieldIcon()이 번들 이미지를 이 이름으로 앱 그룹 폴더에 복사해 둔다.
const SHIELD_ICON_FILE_NAME = 'shield-turtle.png';

// 피그마 "잠금 앱 접근시": 검은 배경, 가운데 흰 거북이 아이콘 + 제목, 아래 초록(강조)/회색(중립) 버튼.
// 쉴드는 애플이 그려주는 화면이라 문구/색/아이콘/버튼 라벨만 바꿀 수 있고, 글꼴·크기·배치는 바꿀 수 없다.
// 제한 시간을 넘겼는지에 따라 문구를 나누는 것도 쉴드 설정이 정적이라 할 수 없다(초과 전 문구 하나로 통일).
export const SHIELD_CONFIGURATION: ShieldConfiguration = {
  // 검은 배경(터닝처럼). 알파를 명시해서 시스템 블러가 비치지 않게 한다.
  backgroundColor: { red: 0, green: 0, blue: 0, alpha: 1 },
  // 블러 스타일을 주지 않으면 시스템 기본(밝은 모드면 밝은 회색) 배경이 깔려 검은색이 안 보인다.
  backgroundBlurStyle: UIBlurEffectStyle.dark,
  iconAppGroupRelativePath: SHIELD_ICON_FILE_NAME,
  title: '지금 해제하면 친구에게 알림이 가요!\n지금 꼭 해제해야 하나요?',
  titleColor: { red: 255, green: 255, blue: 255 },
  // 부제를 비우면 시스템 기본 문구("…제한되었기 때문에 사용할 수 없습니다")가 나와서 공백 하나를 넣는다.
  subtitle: ' ',
  // 피그마 기준 버튼 배치: 위(강조, 초록) = "아니요", 아래(중립, 회색 텍스트) = "지금 꼭 필요해요".
  primaryButtonLabel: '아니요, 안 해도 괜찮아요',
  primaryButtonLabelColor: { red: 255, green: 255, blue: 255 },
  primaryButtonBackgroundColor: { red: 90, green: 137, blue: 116 }, // green[300]
  secondaryButtonLabel: '지금 꼭 필요해요',
  // 보조 버튼 배경은 애플이 정한다(어두운 배경에선 어두운 알약). 그 위에서 읽히도록 라벨은 밝게 한다.
  secondaryButtonLabelColor: { red: 255, green: 255, blue: 255 },
};

/** 쉴드 아이콘 이미지를 앱 그룹 폴더에 복사해 둔다(쉴드 확장이 거기서 읽는다). 실패해도 쉴드는 아이콘만 빠진다. */
export const ensureShieldIcon = async () => {
  try {
    const asset = Asset.fromModule(SHIELD_ICON);
    await asset.downloadAsync();
    const appGroupDirectory = ReactNativeDeviceActivity.getAppGroupFileDirectory();
    if (!asset.localUri || !appGroupDirectory) return;
    ReactNativeDeviceActivity.copyFile(
      asset.localUri,
      `${appGroupDirectory}${SHIELD_ICON_FILE_NAME}`,
      true
    );
  } catch {
    // 아이콘 없이 쉴드를 그린다.
  }
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
  // "아니요, 안 해도 괜찮아요" → 그냥 닫기만 한다.
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
