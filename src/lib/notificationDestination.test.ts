import { describe, expect, it } from 'vitest';

import { getNotificationPath } from './notificationDestination';

describe('푸시 알림 목적지', () => {
  it('같은 NONE 대상이라도 친구 활동은 알림 목록, 재잠금 예고는 제한 앱 현황으로 구분한다', () => {
    for (const type of ['FRIEND_UNLOCKED', 'FRIEND_APP_UNLOCKED', 'FRIEND_TIME_LIMIT_CHANGED']) {
      expect(getNotificationPath({ targetType: 'NONE', type })).toBe('/notifications');
    }
    expect(getNotificationPath({ targetType: 'NONE', type: 'APP_RELOCK_REMINDER' })).toBe(
      '/restricted-apps'
    );
    expect(getNotificationPath({ targetType: 'NONE', type: 'UNKNOWN' })).toBeNull();
  });

  it('해제할 앱이 없는 서버 알림은 임의의 앱을 해제하는 흐름에 진입하지 않는다', () => {
    expect(getNotificationPath({ targetType: 'APP_UNLOCK_TIMER' })).toBe('/restricted-apps');
    const appId = 'app/한글?other=1';
    const path = getNotificationPath({ targetType: 'APP_UNLOCK_TIMER', appId });
    const url = new URL(`detoxmate:/${path}`);
    expect(url.searchParams.get('appId')).toBe(appId);
    expect(url.searchParams.has('other')).toBe(false);
  });
});
