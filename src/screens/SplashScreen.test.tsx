// @vitest-environment jsdom
import { act, createElement, type PropsWithChildren } from 'react';
import { createRoot } from 'react-dom/client';
import { router } from 'expo-router';
import { getItemAsync, setItemAsync } from 'expo-secure-store';
import type { NotificationResponse } from 'expo-notifications';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { logError } from '@/api/errors/logger';
import { setAnalyticsUserId, trackEvent } from '@/lib/analytics';
import { peekPendingInvite, setPendingInvite } from '@/lib/pendingInvite';
import { TERMS_ACCEPTED_KEY } from './auth/authStorageKeys';
import { customAxios } from '@/api/mutator';
import { clearAuthSession, loginWithTestUser } from '@/api/auth';
import SplashScreen from './SplashScreen';

const notifications = vi.hoisted(() => ({ response: null as NotificationResponse | null }));
vi.mock('expo-router');
vi.mock('expo-secure-store');
vi.mock('@react-native-seoul/kakao-login');
vi.mock('expo-apple-authentication');
vi.mock('@/api/client');
vi.mock('@/api/mutator');
vi.mock('@/lib/analytics');
vi.mock('@/api/errors/logger');
vi.mock('expo-notifications', () => ({
  DEFAULT_ACTION_IDENTIFIER: 'tap',
  getLastNotificationResponse: () => notifications.response,
  clearLastNotificationResponse: () => {
    notifications.response = null;
  },
}));
vi.mock('react-native', () => ({
  Platform: { OS: 'ios' },
  View: ({ children }: PropsWithChildren) => children,
  Image: () => null,
  StyleSheet: { create: (styles: unknown) => styles },
}));
vi.mock('@/components', () => ({
  LoggingPage: ({ children }: PropsWithChildren) => children,
}));

Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
let root: ReturnType<typeof createRoot>;
const invite = { kind: 'friend' as const, code: 'fixture-invite' };

beforeEach(async () => {
  vi.resetAllMocks();
  await clearAuthSession();
  notifications.response = null;
  // Metro의 이미지 require만 대체하고 화면 effect와 이동 로직은 실제 구현을 사용한다.
  vi.stubGlobal('require', () => 1);
  root = createRoot(document.createElement('div'));
});
afterEach(async () => {
  await act(() => root.unmount());
  vi.unstubAllGlobals();
});
const mount = () => act(() => root.render(createElement(SplashScreen)));

describe('스플래시의 인증 복원과 최초 진입', () => {
  it.each([null, 'true'])(
    '저장된 약관 동의가 %s이고 미로그인이면 초대를 보존하고 로그인으로 이동한다',
    async (terms) => {
      if (terms) await setItemAsync(TERMS_ACCEPTED_KEY, terms);
      await setPendingInvite(invite);

      await mount();

      expect(router.replace).toHaveBeenCalledExactlyOnceWith('/login');
      expect(await peekPendingInvite()).toEqual(invite);
      expect(setAnalyticsUserId).not.toHaveBeenCalled();
    }
  );

  it.each(['알림과 초대', '초대', '기본'] as const)(
    '로그인 상태에서 %s가 있으면 알림 → 초대 → 제한 앱 우선순위로 이동한다',
    async (destination) => {
      vi.mocked(customAxios).mockResolvedValueOnce({
        id: 21,
        accessToken: 'fixture-token',
        refreshToken: 'fixture-refresh',
      });
      await loginWithTestUser('fixture');
      vi.mocked(customAxios).mockClear();
      await setItemAsync('accessTokenKey', 'fixture-token');
      await setItemAsync('currentUserId', '21');
      if (destination !== '기본') await setPendingInvite(invite);
      if (destination === '알림과 초대') {
        notifications.response = {
          actionIdentifier: 'tap',
          notification: {
            date: 0,
            request: {
              identifier: 'fixture-notification',
              trigger: { type: 'push' },
              content: {
                title: null,
                subtitle: null,
                body: null,
                categoryIdentifier: null,
                sound: null,
                data: { targetType: 'FRIEND_REQUESTS' },
              },
            },
          },
        };
      }

      await mount();

      const expected =
        destination === '알림과 초대'
          ? '/friends'
          : destination === '초대'
            ? { pathname: '/friend-invite', params: { code: invite.code } }
            : '/(tabs)/restricted-apps';
      expect(router.replace).toHaveBeenCalledExactlyOnceWith(expected);
      expect(await peekPendingInvite()).toEqual(destination === '알림과 초대' ? invite : null);
      expect(notifications.response).toBeNull();
      expect(setAnalyticsUserId).toHaveBeenCalledWith('21');
      expect(trackEvent).toHaveBeenCalledWith('App Opened');
    }
  );

  it.each(['currentUserId', 'pendingInviteCode'])(
    '%s 복원 도중 스플래시를 떠나면 늦은 완료가 이동하거나 초대를 소비하지 않는다',
    async (keyToDelay) => {
      vi.mocked(customAxios).mockResolvedValueOnce({
        id: 21,
        accessToken: 'fixture-token',
        refreshToken: 'fixture-refresh',
      });
      await loginWithTestUser('fixture');
      vi.mocked(customAxios).mockClear();
      await setItemAsync('accessTokenKey', 'fixture-token');
      await setPendingInvite(invite);
      const readStoredValue = vi.mocked(getItemAsync).getMockImplementation()!;
      const value = await getItemAsync(keyToDelay);
      const pending = Promise.withResolvers<string | null>();
      const started = Promise.withResolvers<void>();
      vi.mocked(getItemAsync).mockImplementation((key, options) => {
        if (key !== keyToDelay) return readStoredValue(key, options);
        started.resolve();
        return pending.promise;
      });

      await mount();
      await started.promise;
      await act(() => root.render(null));
      await act(async () => pending.resolve(value));

      expect(router.replace).not.toHaveBeenCalled();
      expect(await peekPendingInvite()).toEqual(invite);
    }
  );

  it('탈퇴 후 기기에 토큰이 잠시 남아 있어도 로그인으로 돌아간다', async () => {
    await setItemAsync('accessTokenKey', 'fixture-old-token');
    await mount();
    expect(router.replace).toHaveBeenCalledExactlyOnceWith('/login');
  });

  it('저장소 복원에 실패하면 오류를 기록하고 초대를 지우지 않은 채 로그인으로 복구한다', async () => {
    await setPendingInvite(invite);
    vi.mocked(getItemAsync).mockRejectedValueOnce(new Error('storage unavailable'));

    await mount();

    expect(router.replace).toHaveBeenCalledExactlyOnceWith('/login');
    expect(logError).toHaveBeenCalledWith(expect.anything(), {
      scope: 'app.bootstrap',
      operation: 'restoreInitialRoute',
    });
    expect(await peekPendingInvite()).toEqual(invite);
  });
});
