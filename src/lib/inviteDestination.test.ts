import { router } from 'expo-router';
import { getItemAsync, setItemAsync, deleteItemAsync } from 'expo-secure-store';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { clearAuthSession, loginWithTestUser } from '../api/auth';
import { customAxios } from '../api/mutator';
import { redirectSystemPath } from '../../app/+native-intent';
import { handleInviteDeeplink } from './airbridge';
import { navigateAuthenticated, parseInviteDeeplink } from './inviteDestination';
import { peekPendingInvite, setPendingInvite } from './pendingInvite';
import type { NotificationResponse } from 'expo-notifications';

const routerMock = vi.mocked(router);
const mocks = vi.hoisted(() => ({
  log: vi.fn(),
  notification: null as NotificationResponse | null,
}));
vi.mock('expo-notifications', () => ({
  DEFAULT_ACTION_IDENTIFIER: 'tap',
  getLastNotificationResponse: () => mocks.notification,
  clearLastNotificationResponse: () => {
    mocks.notification = null;
  },
}));
vi.mock('expo-secure-store');
vi.mock('@react-native-seoul/kakao-login');
vi.mock('expo-apple-authentication');
vi.mock('../api/client');
vi.mock('../api/mutator');
vi.mock('expo-router');
vi.mock('react-native', () => ({ Platform: { OS: 'ios' } }));
vi.mock('airbridge-react-native-sdk', () => ({ Airbridge: { setOnDeeplinkReceived: vi.fn() } }));
vi.mock('../api/errors', () => ({
  normalizeError: (error: unknown) => error,
  logError: mocks.log,
}));

const friend = { kind: 'friend' as const, code: 'random-friend-code' };
function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((res) => {
    resolve = res;
  });
  return { promise, resolve };
}

beforeEach(async () => {
  mocks.notification = null;
  vi.resetAllMocks();
  vi.mocked(customAxios).mockResolvedValue({
    id: 21,
    accessToken: 'fixture-token',
    refreshToken: 'fixture-refresh',
  });
  await loginWithTestUser('fixture');
});

const navigate = (options: Partial<Parameters<typeof navigateAuthenticated>[0]> = {}) =>
  navigateAuthenticated({
    replace: routerMock.replace,
    resolveDefault: async () => '/(group)/home',
    ...options,
  });

function tapNotification(data: Record<string, unknown>) {
  mocks.notification = {
    actionIdentifier: 'tap',
    notification: { request: { content: { data } } },
  } as NotificationResponse;
}

describe('인증과 비동기 시작 과정에서 알림 복귀', () => {
  it('미로그인 알림은 보존하고 로그인 후 목적지로 한 번만 이동한다', async () => {
    tapNotification({ targetType: 'FRIEND_REQUESTS' });
    await clearAuthSession();
    await navigate();
    expect(routerMock.replace).toHaveBeenLastCalledWith('/login');
    expect(mocks.notification).not.toBeNull();

    await loginWithTestUser('fixture');
    await navigate();
    expect(routerMock.replace).toHaveBeenLastCalledWith('/friends');
    expect(mocks.notification).toBeNull();
    await navigate();
    expect(routerMock.replace).toHaveBeenLastCalledWith('/(group)/home');
  });

  it('기본 피드 조회 중 도착한 알림을 늦은 피드 응답이 덮어쓰지 않는다', async () => {
    const feed = deferred<'/(feed)/home'>();
    const started = deferred<void>();
    const navigation = navigate({
      resolveDefault: () => {
        started.resolve();
        return feed.promise;
      },
    });
    await started.promise;
    tapNotification({ targetType: 'NONE', type: 'APP_RELOCK_REMINDER' });
    feed.resolve('/(feed)/home');
    await navigation;
    expect(routerMock.replace).toHaveBeenCalledOnce();
    expect(routerMock.replace).toHaveBeenCalledWith('/restricted-apps');
  });

  it('시작 화면이 취소되거나 라우팅이 실패하면 알림을 소비하지 않는다', async () => {
    tapNotification({ targetType: 'FRIENDS' });
    await navigate({ isActive: () => false });
    expect(routerMock.replace).not.toHaveBeenCalled();
    expect(mocks.notification).not.toBeNull();

    routerMock.replace.mockImplementationOnce(() => {
      throw new Error('router unavailable');
    });
    await expect(navigate()).rejects.toThrow('router unavailable');
    expect(mocks.notification).not.toBeNull();
  });
});

describe('인증과 비동기 시작 과정에서 초대 복귀', () => {
  it('미로그인 초대는 로그인 중 보존하고 인증 후 친구 초대로 복귀한다', async () => {
    await setPendingInvite(friend);
    await clearAuthSession();
    await navigate();
    expect(routerMock.replace).toHaveBeenLastCalledWith('/login');
    expect(await peekPendingInvite()).toEqual(friend);

    await loginWithTestUser('fixture');
    await navigate();
    expect(routerMock.replace).toHaveBeenLastCalledWith({
      pathname: '/friend-invite',
      params: { code: friend.code },
    });
    expect(await peekPendingInvite()).toBeNull();
  });

  it('시작 화면이 읽기 도중 취소되면 라우팅하거나 초대를 소비하지 않는다', async () => {
    await setPendingInvite(friend);
    const pendingInvite = deferred<string>();
    const readStoredValue = vi.mocked(getItemAsync).getMockImplementation()!;
    vi.mocked(getItemAsync).mockImplementation((key, options) =>
      key === 'pendingInviteCode' ? pendingInvite.promise : readStoredValue(key, options)
    );
    let active = true;
    const navigation = navigate({ isActive: () => active });
    active = false;
    pendingInvite.resolve(JSON.stringify(friend));
    await navigation;
    expect(routerMock.replace).not.toHaveBeenCalled();
    expect(await peekPendingInvite()).toEqual(friend);
  });

  it('토큰 삭제가 지연되어도 종료된 세션은 초대를 소비하지 않고 로그인으로 돌아간다', async () => {
    await setPendingInvite(friend);
    const deletion = Promise.withResolvers<void>();
    const removeStoredValue = vi.mocked(deleteItemAsync).getMockImplementation()!;
    vi.mocked(deleteItemAsync).mockImplementation((key, options) =>
      key === 'accessTokenKey'
        ? deletion.promise.then(() => removeStoredValue(key, options))
        : removeStoredValue(key, options)
    );
    const clearing = clearAuthSession();
    expect(await getItemAsync('accessTokenKey')).toBe('fixture-token');

    try {
      await navigate();
      expect(routerMock.replace).toHaveBeenLastCalledWith('/login');
      expect(await peekPendingInvite()).toEqual(friend);
    } finally {
      deletion.resolve();
      await clearing;
    }
  });

  it('기본 피드 조회 중 도착한 초대를 늦은 피드 응답이 덮어쓰지 않는다', async () => {
    const feed = deferred<'/(feed)/home'>();
    const started = deferred<void>();
    const navigation = navigate({
      resolveDefault: () => {
        started.resolve();
        return feed.promise;
      },
    });
    await started.promise;
    await setPendingInvite(friend);
    feed.resolve('/(feed)/home');
    await navigation;
    expect(routerMock.replace).toHaveBeenCalledOnce();
    expect(routerMock.replace).toHaveBeenCalledWith({
      pathname: '/friend-invite',
      params: { code: friend.code },
    });
  });

  it('기본 화면 조회 중 세션이 만료되면 보호 화면 대신 로그인으로 이동하고 초대는 보존한다', async () => {
    const feed = deferred<'/(feed)/home'>();
    const started = deferred<void>();
    const navigation = navigate({
      resolveDefault: () => {
        started.resolve();
        return feed.promise;
      },
    });
    await started.promise;
    await setPendingInvite(friend);
    await clearAuthSession();
    feed.resolve('/(feed)/home');
    await navigation;
    expect(routerMock.replace).toHaveBeenLastCalledWith('/login');
    expect(await peekPendingInvite()).toEqual(friend);
  });

  it('라우터가 화면 이동을 거부하면 초대를 삭제하지 않는다', async () => {
    await setPendingInvite(friend);
    routerMock.replace.mockImplementationOnce(() => {
      throw new Error('router unavailable');
    });
    await expect(navigate()).rejects.toThrow('router unavailable');
    expect(await peekPendingInvite()).toEqual(friend);
  });

  it('기존 설치 앱에 저장된 그룹 코드는 그룹 참여로 복귀한다', async () => {
    await setItemAsync('pendingInviteCode', 'ABCDE');
    await navigate();
    expect(routerMock.replace).toHaveBeenLastCalledWith({
      pathname: '/(group)/join',
      params: { inviteCode: 'ABCDE' },
    });
    expect(await peekPendingInvite()).toBeNull();
  });
});

describe('네이티브 링크와 SDK 전달의 초대 분류', () => {
  it('Expo가 처리한 링크를 SDK도 전달하면 이미 열린 초대를 다시 시작하지 않는다', async () => {
    const path = 'detoxmate://friend-invite?code=random-friend-code';
    expect(await redirectSystemPath({ path, initial: true })).toBe('/');
    await navigate();
    routerMock.replace.mockClear();
    await handleInviteDeeplink(path);
    expect(routerMock.replace).not.toHaveBeenCalled();
    expect(await peekPendingInvite()).toBeNull();
  });

  it('설치 후 SDK만 전달한 초대는 저장하고 인증 진입점에서 복귀시킨다', async () => {
    await handleInviteDeeplink('detoxmate://friend-invite?code=deferred-install');
    expect(routerMock.replace).toHaveBeenLastCalledWith('/');
    expect(await peekPendingInvite()).toEqual({ kind: 'friend', code: 'deferred-install' });
  });

  it('허용하지 않은 호스트나 다른 기능의 쿼리를 친구 또는 그룹 초대로 해석하지 않는다', () => {
    expect(parseInviteDeeplink('https://example.com/?invite_code=ABCDE')).toBeNull();
    expect(parseInviteDeeplink('http://example.com/?invite_code=ABCDE')).toBeNull();
    expect(parseInviteDeeplink('detoxmate://oauth?invite_code=ABCDE')).toBeNull();
    expect(parseInviteDeeplink('https://detoxmate.airbridge.io/?invite_code=ABCDE')).toEqual({
      kind: 'group',
      code: 'ABCDE',
    });
    expect(parseInviteDeeplink('http://detoxmate.airbridge.io/?invite_code=ABCDE')).toEqual({
      kind: 'group',
      code: 'ABCDE',
    });
  });
});
