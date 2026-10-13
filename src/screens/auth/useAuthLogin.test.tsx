// @vitest-environment jsdom
import { act, createElement } from 'react';
import { createRoot } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { router } from 'expo-router';

import { peekPendingInvite, setPendingInvite } from '../../lib/pendingInvite';
import { queryClient } from '../../lib/query/queryClient';
import { useAuthLogin } from './useAuthLogin';

const routerMock = vi.mocked(router);
const mocks = vi.hoisted(() => ({
  kakao: vi.fn(),
  authHttp: vi.fn(),
  requests: new AbortController(),
  mediaPermission: vi.fn(),
  notificationPermission: vi.fn(),
}));
vi.mock('expo-secure-store');
vi.mock('expo-router');
vi.mock('@react-native-seoul/kakao-login', () => ({ login: mocks.kakao }));
vi.mock('expo-apple-authentication', () => ({}));
vi.mock('../../api/client', () => ({
  getAuthenticatedRequestSignal: () => mocks.requests.signal,
  cancelAuthenticatedRequests: () => mocks.requests.abort(),
  resumeAuthenticatedRequests: () => {
    mocks.requests = new AbortController();
  },
  default: Object.assign(
    vi.fn(async () => ({ data: undefined })),
    { post: mocks.authHttp }
  ),
}));
vi.mock('expo-image-picker', () => ({
  requestMediaLibraryPermissionsAsync: mocks.mediaPermission,
}));
vi.mock('expo-notifications', () => ({
  DEFAULT_ACTION_IDENTIFIER: 'tap',
  getLastNotificationResponse: () => null,
  requestPermissionsAsync: mocks.notificationPermission,
  getPermissionsAsync: async () => ({ status: 'granted' }),
}));
vi.mock('@react-native-firebase/messaging', () => ({
  getMessaging: () => ({}),
  registerDeviceForRemoteMessages: async () => undefined,
  getToken: async () => '',
  onTokenRefresh: vi.fn(),
}));
vi.mock('react-native', () => ({ Platform: { OS: 'ios' } }));
vi.mock('@/lib/analytics');
vi.mock('@sentry/react-native', () => ({}));
vi.mock('expo-constants', () => ({
  default: {
    expoConfig: {
      extra: {
        appEnv: 'production',
        appVersion: 'test',
        buildChannel: 'local',
        apiBaseUrl: 'https://api.example.test',
        amplitudeApiKey: 'test',
      },
    },
  },
}));
Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
const cleanups: (() => void)[] = [];

beforeEach(() => {
  vi.resetAllMocks();
  mocks.requests = new AbortController();
  queryClient.clear();
  mocks.kakao.mockResolvedValue({ accessToken: 'provider-token' });
  mocks.authHttp.mockResolvedValue({
    data: {
      id: 21,
      displayName: '테스트 사용자',
      accessToken: 'session-token',
      refreshToken: 'refresh-token',
      isNewUser: false,
    },
  });
  mocks.mediaPermission.mockResolvedValue({ status: 'granted' });
  mocks.notificationPermission.mockResolvedValue({ status: 'granted' });
});
afterEach(async () => {
  await act(() => cleanups.splice(0).forEach((cleanup) => cleanup()));
  queryClient.clear();
  vi.useRealTimers();
});

async function setup() {
  let current!: ReturnType<typeof useAuthLogin>;
  function Harness() {
    current = useAuthLogin();
    return null;
  }
  const root = createRoot(document.createElement('div'));
  cleanups.push(() => root.unmount());
  await act(() => root.render(createElement(Harness)));
  return {
    get state() {
      return current;
    },
  };
}

describe('인증 후 신규 가입 분기', () => {
  it('신규 가입이면 초대를 보존한 채 온보딩으로 이동한다', async () => {
    const invite = { kind: 'friend' as const, code: 'random-friend-code' };
    await setPendingInvite(invite);
    mocks.authHttp.mockResolvedValueOnce({
      data: {
        id: 21,
        accessToken: 'session-token',
        refreshToken: 'refresh-token',
        isNewUser: true,
      },
    });
    const screen = await setup();
    await act(() => screen.state.handleKakaoLogin());
    expect(routerMock.replace).toHaveBeenLastCalledWith('/onboarding');
    expect(await peekPendingInvite()).toEqual(invite);
  });
  it('재로그인은 새 온보딩으로 복귀하지 않고 대기 초대로 이동한다', async () => {
    const invite = { kind: 'friend' as const, code: 'random-friend-code' };
    await setPendingInvite(invite);
    const screen = await setup();
    await act(() => screen.state.handleKakaoLogin());
    expect(routerMock.replace).toHaveBeenLastCalledWith({
      pathname: '/friend-invite',
      params: { code: invite.code },
    });
    expect(await peekPendingInvite()).toBeNull();
  });
  it('동시 로그인은 한 번만 인증하고 기존 사용자의 기본 목적지는 제한 앱이다', async () => {
    const oauth = Promise.withResolvers<{ accessToken: string }>();
    mocks.kakao.mockReturnValueOnce(oauth.promise);
    const screen = await setup();
    let login!: Promise<void>;
    await act(() => {
      login = screen.state.handleKakaoLogin();
      void screen.state.handleKakaoLogin();
    });
    expect(mocks.kakao).toHaveBeenCalledTimes(1);
    await act(async () => {
      oauth.resolve({ accessToken: 'provider-token' });
      await login;
    });
    expect(routerMock.replace).toHaveBeenLastCalledWith('/(tabs)/restricted-apps');
  });
});
