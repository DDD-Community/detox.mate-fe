import * as Notifications from 'expo-notifications';

import { logError, normalizeError } from '../api/errors';

// 재잠금 이만큼 전에 알림을 보낸다.
const WARNING_BEFORE_RELOCK_MS = 60_000;
const WARNING_MESSAGE = '앱 사용 시간이 얼마 남지 않았어요!';

const identifierFor = (appId: string) => `relock-warning-${appId}`;

/** 이 앱에 예약해 둔 "곧 다시 잠겨요" 알림을 취소한다(재해제로 시간이 바뀌었거나 등록이 해제됐을 때). */
export const cancelRelockWarning = async (appId: string) => {
  try {
    await Notifications.cancelScheduledNotificationAsync(identifierFor(appId));
  } catch (error) {
    logError(normalizeError(error), { scope: 'notification', operation: 'cancelRelockWarning' });
  }
};

/**
 * 재잠금 1분 전에 로컬 알림을 예약한다. 앱이 백그라운드/종료 상태여도 OS가 보낸다. 같은 앱의
 * 이전 예약은 먼저 취소하고, 재잠금까지 1분이 안 남았으면 예약하지 않는다.
 */
export const scheduleRelockWarning = async (appId: string, relockAt: Date) => {
  await cancelRelockWarning(appId);

  const warnAt = new Date(relockAt.getTime() - WARNING_BEFORE_RELOCK_MS);
  if (warnAt.getTime() <= Date.now()) return;

  try {
    await Notifications.scheduleNotificationAsync({
      identifier: identifierFor(appId),
      content: { title: 'Detox mate', body: WARNING_MESSAGE },
      trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: warnAt },
    });
  } catch (error) {
    logError(normalizeError(error), { scope: 'notification', operation: 'scheduleRelockWarning' });
  }
};
