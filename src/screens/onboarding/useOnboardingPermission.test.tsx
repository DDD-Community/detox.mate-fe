// @vitest-environment jsdom
import { act, createElement } from 'react';
import { createRoot } from 'react-dom/client';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { useOnboardingPermission } from './useOnboardingPermission';

const mocks = vi.hoisted(() => ({
  granted: false,
  canAskAgain: true,
  screenTimeStatus: 1,
  request: vi.fn(),
  push: vi.fn(),
  listener: undefined as undefined | ((state: string) => void),
  alert: vi.fn(),
  openSettings: vi.fn(),
}));
vi.mock('expo-notifications', () => ({
  getPermissionsAsync: async () => ({
    granted: mocks.granted,
    canAskAgain: mocks.canAskAgain,
    status: mocks.granted ? 'granted' : mocks.canAskAgain ? 'undetermined' : 'denied',
  }),
  requestPermissionsAsync: mocks.request,
}));
vi.mock('react-native-device-activity', () => ({
  AuthorizationStatus: { denied: 1, approved: 2 },
  getAuthorizationStatus: () => mocks.screenTimeStatus,
  requestAuthorization: mocks.request,
}));
vi.mock('react-native', () => ({
  Alert: { alert: mocks.alert },
  Linking: { openSettings: mocks.openSettings },
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
vi.mock('@/lib/fcmToken', () => ({ registerDevicePushToken: mocks.push }));
vi.mock('@/api/errors', () => ({
  normalizeError: (error: unknown) => error,
  logError: vi.fn(),
  getUserErrorMessage: () => '다시 시도해 주세요.',
}));
Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
const cleanups: (() => void)[] = [];
beforeEach(() => {
  vi.resetAllMocks();
  mocks.granted = false;
  mocks.canAskAgain = true;
  mocks.screenTimeStatus = 1;
});
afterEach(async () => {
  await act(() => cleanups.splice(0).forEach((cleanup) => cleanup()));
});
async function setup(permission: 'screen-time' | 'notifications' = 'notifications') {
  let state!: ReturnType<typeof useOnboardingPermission>;
  const next = vi.fn();
  function Harness() {
    state = useOnboardingPermission(permission, next);
    return null;
  }
  const root = createRoot(document.createElement('div'));
  cleanups.push(() => root.unmount());
  await act(() => root.render(createElement(Harness)));
  return {
    get state() {
      return state;
    },
    next,
  };
}
it('알림 거절 시 선택 가능한 안내를 보여주고 설정 복귀로 허용하면 등록 실패에도 한 번만 진행한다', async () => {
  const screen = await setup();
  await act(() => screen.state.request());
  expect(screen.next).not.toHaveBeenCalled();
  expect(screen.state.notificationDenied).toBe(true);
  expect(mocks.alert).not.toHaveBeenCalled();
  mocks.granted = true;
  mocks.push.mockRejectedValue(new Error('토큰 등록 실패'));
  await act(() => mocks.listener?.('active'));
  await act(() => mocks.listener?.('active'));
  expect(screen.next).toHaveBeenCalledTimes(1);
});
it('시스템 요청과 복귀 이벤트가 겹쳐도 요청과 이동이 중복되지 않는다', async () => {
  const request = Promise.withResolvers<void>();
  mocks.request.mockReturnValue(request.promise);
  const screen = await setup();
  let pending!: Promise<void>;
  await act(() => {
    pending = screen.state.request();
  });
  await act(() => {
    void screen.state.request();
    screen.state.skip();
    mocks.listener?.('active');
  });
  expect(mocks.request).toHaveBeenCalledTimes(1);
  expect(screen.next).not.toHaveBeenCalled();
  await act(async () => {
    mocks.granted = true;
    request.resolve();
    await pending;
  });
  expect(screen.next).toHaveBeenCalledTimes(1);
});

it('알림을 거절한 뒤 나중에 하기를 누르면 권한 요청과 토큰 등록 없이 한 번만 진행한다', async () => {
  const screen = await setup();
  await act(() => screen.state.request());
  mocks.request.mockClear();
  await act(() => {
    screen.state.skip();
    screen.state.skip();
  });
  mocks.granted = true;
  await act(() => mocks.listener?.('active'));
  expect(screen.next).toHaveBeenCalledTimes(1);
  expect(mocks.request).not.toHaveBeenCalled();
  expect(mocks.push).not.toHaveBeenCalled();
});

it('이미 거절한 알림은 안내에서 설정을 열고 미허용으로 돌아와도 나중에 진행할 수 있다', async () => {
  mocks.canAskAgain = false;
  const screen = await setup();
  expect(screen.state.notificationDenied).toBe(true);
  await act(() => screen.state.request());
  expect(mocks.openSettings).toHaveBeenCalledTimes(1);
  expect(mocks.request).not.toHaveBeenCalled();
  await act(() => mocks.listener?.('active'));
  expect(screen.state.notificationDenied).toBe(true);
  expect(screen.next).not.toHaveBeenCalled();
  await act(() => screen.state.skip());
  expect(screen.next).toHaveBeenCalledTimes(1);
});

it('설정 열기에 실패해도 알림 미동의 안내에서 나중에 진행할 수 있다', async () => {
  mocks.canAskAgain = false;
  mocks.openSettings.mockRejectedValue(new Error('설정 열기 실패'));
  const screen = await setup();
  await act(() => screen.state.request());
  expect(screen.state.pending).toBe(false);
  expect(screen.state.notificationDenied).toBe(true);
  expect(mocks.alert).toHaveBeenCalled();
  await act(() => screen.state.skip());
  expect(screen.next).toHaveBeenCalledTimes(1);
});

it('이미 거절한 스크린타임 권한은 시스템 요청을 반복하지 않고 설정을 안내한다', async () => {
  mocks.screenTimeStatus = 1;
  const screen = await setup('screen-time');
  await act(() => screen.state.skip());
  await act(() => screen.state.request());
  expect(mocks.request).not.toHaveBeenCalled();
  expect(mocks.alert).toHaveBeenCalledWith(
    '권한 허용이 필요해요',
    expect.any(String),
    expect.arrayContaining([expect.objectContaining({ text: '설정으로 가기' })])
  );
  expect(screen.next).not.toHaveBeenCalled();
  mocks.screenTimeStatus = 2;
  await act(() => mocks.listener?.('active'));
  expect(screen.next).toHaveBeenCalledTimes(1);
});

it('이미 알림을 허용했다면 재요청 없이 진행하고 복귀 이벤트에도 완료를 반복하지 않는다', async () => {
  mocks.granted = true;
  const screen = await setup();
  await act(() => mocks.listener?.('active'));
  expect(screen.next).toHaveBeenCalledTimes(1);
  expect(mocks.push).toHaveBeenCalledTimes(1);
  expect(mocks.request).not.toHaveBeenCalled();
});
