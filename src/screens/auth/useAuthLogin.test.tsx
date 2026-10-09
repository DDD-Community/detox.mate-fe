// @vitest-environment jsdom
import { act, createElement } from 'react';
import { createRoot } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { peekPendingInvite, setPendingInvite } from '../../lib/pendingInvite';
import { queryClient } from '../../lib/query/queryClient';
import { APP_ACCESS_PERMISSION_GUIDE_SEEN_KEY } from './authStorageKeys';
import { useAuthLogin } from './useAuthLogin';

const mocks = vi.hoisted(() => ({
  storage: new Map<string, string>(),
  replace: vi.fn(),
  kakao: vi.fn(),
  authHttp: vi.fn(),
  requests: new AbortController(),
  mediaPermission: vi.fn(),
  notificationPermission: vi.fn(),
}));
vi.mock('expo-secure-store', () => ({
  getItemAsync: async (key: string) => mocks.storage.get(key) ?? null,
  setItemAsync: async (key: string, value: string) => {
    mocks.storage.set(key, value);
  },
  deleteItemAsync: async (key: string) => {
    mocks.storage.delete(key);
  },
}));
vi.mock('expo-router', () => ({ useRouter: () => ({ replace: mocks.replace }) }));
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
vi.mock('@amplitude/analytics-react-native', () => ({
  setUserId: vi.fn(),
  track: vi.fn(),
  Identify: vi.fn(),
  identify: vi.fn(),
  init: vi.fn(),
  Types: {},
}));
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
  mocks.storage.clear();
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
  mocks.storage.clear();
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

describe('초대 링크의 카카오 로그인과 권한 안내 복귀', () => {
  it('로그인과 권한 안내 동안 친구 초대를 보존하고 안내 완료 뒤 정확한 초대 화면으로 이동한다', async () => {
    vi.useFakeTimers();
    const invite = { kind: 'friend' as const, code: 'random-friend-code' };
    await setPendingInvite(invite);
    const oauth = Promise.withResolvers<{ accessToken: string }>();
    mocks.kakao.mockReturnValueOnce(oauth.promise);
    const screen = await setup();

    await act(() => screen.state.handleKakaoLogin());
    expect(screen.state.pendingProvider).toBe('kakao');
    expect(await peekPendingInvite()).toEqual(invite);
    expect(mocks.replace).not.toHaveBeenCalled();

    await act(async () => {
      oauth.resolve({ accessToken: 'provider-token' });
    });
    expect(screen.state.permissionGuideVisible).toBe(true);
    expect(await peekPendingInvite()).toEqual(invite);
    expect(mocks.replace).not.toHaveBeenCalled();

    await act(async () => {
      const confirming = screen.state.handleConfirmPermissionGuide();
      await vi.advanceTimersByTimeAsync(350);
      await confirming;
    });
    expect(mocks.replace).toHaveBeenLastCalledWith({
      pathname: '/friend-invite',
      params: { code: invite.code },
    });
    expect(await peekPendingInvite()).toBeNull();
    expect(screen.state.permissionGuideConfirming).toBe(false);
  });

  it('권한 안내를 마친 사용자가 기존 그룹 초대로 로그인하면 그룹 참여로 복귀한다', async () => {
    mocks.storage.set('pendingInviteCode', 'ABCDE');
    mocks.storage.set(APP_ACCESS_PERMISSION_GUIDE_SEEN_KEY, 'true');
    const screen = await setup();

    await act(() => screen.state.handleKakaoLogin());

    expect(screen.state.permissionGuideVisible).toBe(false);
    expect(mocks.replace).toHaveBeenLastCalledWith({
      pathname: '/(group)/join',
      params: { inviteCode: 'ABCDE' },
    });
    expect(await peekPendingInvite()).toBeNull();
  });
});
