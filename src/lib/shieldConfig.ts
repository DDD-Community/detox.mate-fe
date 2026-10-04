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
const SEND_UNLOCK_NOTIFICATION_ACTION: Action = {
  type: 'sendNotification',
  payload: {
    title: 'Detox mate',
    body: '앱을 사용하려면, 이 알림을 클릭해주세요!',
    userInfo: { type: APP_UNLOCK_REQUEST_NOTIFICATION_TYPE },
  },
};

export const SHIELD_ACTIONS: ShieldActions = {
  // "아니요, 안해도 괜찮아요" → 그냥 닫기만 한다.
  primary: { behavior: 'close' },
  // "지금 꼭 필요해요" → 친구에게 알림을 보내고 닫는다.
  secondary: { behavior: 'close', actions: [SEND_UNLOCK_NOTIFICATION_ACTION] },
};
