// @vitest-environment jsdom
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, createElement } from 'react';
import { createRoot } from 'react-dom/client';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { cancelAuthenticatedRequests, resumeAuthenticatedRequests } from '@/api/client';
import { getMyProfileQueryOptions } from '@/api/userQueries';
import { trackEvent } from '@/lib/analytics';
import { useSettingsPushNotifications } from './useSettingsPushNotifications';

const mocks = vi.hoisted(() => ({
  getMe: vi.fn(),
  update: vi.fn(),
  permission: vi.fn(),
  request: vi.fn(),
  register: vi.fn(),
  unregister: vi.fn(),
  ensure: vi.fn(),
  toast: vi.fn(),
  log: vi.fn(),
  listener: undefined as undefined | ((state: string) => void),
}));
vi.mock('@/api/client');
vi.mock('@/lib/analytics');
vi.mock('@/api/generated/user/user', () => ({
  getUser: () => ({ getMe: mocks.getMe, updatePushNotificationSetting: mocks.update }),
}));
vi.mock('@/api/errors', () => ({
  normalizeError: (error: Error) => ({ type: 'unknown', message: error.message }),
  logError: mocks.log,
  getUserErrorMessage: (error: Error) => error.message,
}));
vi.mock('@/stores/networkErrorToastStore', () => ({
  useNetworkErrorToastStore: { getState: () => ({ showMessage: mocks.toast }) },
}));
vi.mock('@/lib/fcmToken', () => ({
  registerDevicePushToken: mocks.register,
  unregisterDevicePushToken: mocks.unregister,
  ensureDevicePushTokenRegistered: mocks.ensure,
}));
vi.mock('expo-notifications', () => ({
  getPermissionsAsync: mocks.permission,
  requestPermissionsAsync: mocks.request,
}));
vi.mock('expo-router', async () => {
  const { useEffect } = await import('react');
  return { useFocusEffect: (callback: () => () => void) => useEffect(callback, [callback]) };
});
vi.mock('react-native', () => ({
  AppState: {
    addEventListener: (_: string, listener: (state: string) => void) => {
      mocks.listener = listener;
      return {
        remove: () => {
          mocks.listener = undefined;
        },
      };
    },
  },
}));
Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
const cleanup: (() => void)[] = [];
beforeEach(() => {
  vi.clearAllMocks();
  mocks.permission.mockResolvedValue({ status: 'granted', canAskAgain: true });
  mocks.update.mockResolvedValue(undefined);
  mocks.unregister.mockResolvedValue(undefined);
});
afterEach(async () => {
  await act(() => cleanup.splice(0).forEach((fn) => fn()));
});
async function setup(enabled = true) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const options = getMyProfileQueryOptions();
  mocks.getMe.mockImplementation(async () => client.getQueryData(options.queryKey));
  client.setQueryData(options.queryKey, {
    id: 1,
    displayName: '테스트',
    userCode: 'TEST1',
    profileImageUrl: null,
    pushNotificationEnabled: enabled,
  });
  const permissionRequired = vi.fn();
  let state!: ReturnType<typeof useSettingsPushNotifications>;
  function Harness() {
    state = useSettingsPushNotifications(permissionRequired);
    return null;
  }
  const root = createRoot(document.createElement('div'));
  cleanup.push(() => {
    root.unmount();
    client.clear();
  });
  await act(() =>
    root.render(createElement(QueryClientProvider, { client }, createElement(Harness)))
  );
  return {
    client,
    permissionRequired,
    get state() {
      return state;
    },
  };
}
it('푸시 저장 실패 시 기존 수신 동의를 유지하고 토큰을 삭제하지 않는다', async () => {
  const screen = await setup();
  mocks.update.mockRejectedValueOnce(new Error('저장 실패'));
  await act(() => screen.state.toggle(false));
  expect(
    screen.client.getQueryData(getMyProfileQueryOptions().queryKey)?.pushNotificationEnabled
  ).toBe(true);
  expect(mocks.unregister).not.toHaveBeenCalled();
  expect(trackEvent).not.toHaveBeenCalled();
  expect(mocks.toast).toHaveBeenCalled();
  expect(screen.state.pending).toBe(false);
});
it('수신 동의 저장 성공 뒤 토큰 삭제가 실패해도 저장값과 성공 기록을 유지한다', async () => {
  const screen = await setup();
  mocks.unregister.mockRejectedValueOnce(new Error('토큰 삭제 실패'));
  await act(() => screen.state.toggle(false));
  expect(
    screen.client.getQueryData(getMyProfileQueryOptions().queryKey)?.pushNotificationEnabled
  ).toBe(false);
  expect(trackEvent).toHaveBeenCalledTimes(1);
  expect(mocks.log).toHaveBeenCalled();
  expect(mocks.toast).not.toHaveBeenCalled();
});
it('저장 중 연속 조작을 막고 이전 세션의 늦은 성공을 새 계정에 반영하지 않는다', async () => {
  const screen = await setup();
  const saved = Promise.withResolvers<void>();
  mocks.update.mockReturnValueOnce(saved.promise);
  let pending!: Promise<void>;
  await act(() => {
    pending = screen.state.toggle(false);
  });
  await act(() => screen.state.toggle(false));
  expect(mocks.update).toHaveBeenCalledTimes(1);
  cancelAuthenticatedRequests();
  resumeAuthenticatedRequests();
  await act(async () => {
    saved.resolve();
    await pending;
  });
  expect(
    screen.client.getQueryData(getMyProfileQueryOptions().queryKey)?.pushNotificationEnabled
  ).toBe(true);
  expect(trackEvent).not.toHaveBeenCalled();
  expect(mocks.unregister).not.toHaveBeenCalled();
});
it('권한 거부 후 설정에서 허용해 돌아와도 서버 수신 동의를 자동으로 켜지 않는다', async () => {
  mocks.permission.mockResolvedValue({ status: 'denied', canAskAgain: false });
  const screen = await setup(false);
  await act(() => screen.state.toggle(true));
  expect(screen.permissionRequired).toHaveBeenCalledOnce();
  expect(mocks.update).not.toHaveBeenCalled();
  mocks.permission.mockResolvedValue({ status: 'granted' });
  await act(() => mocks.listener?.('active'));
  expect(screen.state.enabled).toBe(false);
  expect(mocks.ensure).not.toHaveBeenCalled();
});

it('최초 알림 요청을 거절하면 수신 동의와 토큰을 저장하지 않고 재시도할 수 있다', async () => {
  mocks.permission.mockResolvedValue({ status: 'undetermined', canAskAgain: true });
  mocks.request.mockResolvedValue({ status: 'denied', canAskAgain: false });
  const screen = await setup(false);
  await act(() => screen.state.toggle(true));
  expect(screen.permissionRequired).toHaveBeenCalledOnce();
  expect(screen.state.enabled).toBe(false);
  expect(screen.state.pending).toBe(false);
  expect(mocks.update).not.toHaveBeenCalled();
  expect(mocks.register).not.toHaveBeenCalled();

  mocks.permission.mockResolvedValue({ status: 'granted', canAskAgain: false });
  await act(() => screen.state.toggle(true));
  expect(screen.state.enabled).toBe(true);
  expect(mocks.update).toHaveBeenCalledWith({ pushNotificationEnabled: true });
  expect(mocks.register).toHaveBeenCalledOnce();
});

it('앱 수신 동의가 켜진 상태에서는 OS 권한 허용 후 복귀하면 토글과 토큰을 복구한다', async () => {
  mocks.permission.mockResolvedValue({ status: 'denied', canAskAgain: false });
  const screen = await setup(true);
  expect(screen.state.enabled).toBe(false);
  mocks.permission.mockResolvedValue({ status: 'granted', canAskAgain: false });
  await act(() => mocks.listener?.('active'));
  expect(screen.state.enabled).toBe(true);
  expect(mocks.ensure).toHaveBeenCalledOnce();
  expect(mocks.update).not.toHaveBeenCalled();
});
