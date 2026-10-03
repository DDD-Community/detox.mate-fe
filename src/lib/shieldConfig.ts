import type { Action, ShieldActions, ShieldConfiguration } from 'react-native-device-activity';
import { APP_UNLOCK_REQUEST_NOTIFICATION_TYPE } from './notificationTypes';

export const SHIELD_CONFIGURATION: ShieldConfiguration = {
  backgroundColor: { red: 11, green: 11, blue: 12 },
  title: '지금 꼭 해제해야 하나요?',
  titleColor: { red: 255, green: 255, blue: 255 },
  primaryButtonLabel: '지금 꼭 필요해요',
  secondaryButtonLabel: '아니요, 안해도 괜찮아요!',
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
  primary: { behavior: 'close', actions: [SEND_UNLOCK_NOTIFICATION_ACTION] },
  secondary: { behavior: 'close' },
};
