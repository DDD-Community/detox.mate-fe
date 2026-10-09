import { APP_UNLOCK_REQUEST_NOTIFICATION_TYPE } from './notificationTypes';

type NotificationPath =
  | '/friends'
  | '/notifications'
  | '/restricted-apps'
  | `/unlock-timer?appId=${string}`;

/** 경로 앞에 detoxmate:/를 붙이면 정책의 URL Scheme이 된다. */
export function getNotificationPath(data: Record<string, unknown> = {}): NotificationPath | null {
  if (
    data.targetType === 'APP_UNLOCK_TIMER' ||
    data.type === APP_UNLOCK_REQUEST_NOTIFICATION_TYPE
  ) {
    return typeof data.appId === 'string' && data.appId.length > 0
      ? `/unlock-timer?appId=${encodeURIComponent(data.appId)}`
      : '/restricted-apps';
  }

  switch (data.targetType) {
    case 'FRIEND_REQUESTS':
    case 'FRIENDS':
      return '/friends';
    case 'NONE':
      switch (data.type) {
        case 'FRIEND_UNLOCKED':
        case 'FRIEND_APP_UNLOCKED':
        case 'FRIEND_TIME_LIMIT_CHANGED':
          return '/notifications';
        case 'APP_RELOCK_REMINDER':
          return '/restricted-apps';
        default:
          return null;
      }
    // 현재 서버가 발송하는 그룹 알림은 기존 알림 목록에서 상세 이동을 처리한다.
    case 'GROUP':
    case 'FEED':
    case 'FEED_DETAIL':
    case 'GROUP_CHALLENGE':
    case 'MY_PAGE':
      return '/notifications';
    default:
      return null;
  }
}
