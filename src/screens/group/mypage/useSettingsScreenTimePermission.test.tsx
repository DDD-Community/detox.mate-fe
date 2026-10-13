// @vitest-environment jsdom
import { act, createElement } from 'react';
import { createRoot } from 'react-dom/client';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { useSettingsScreenTimePermission } from './useSettingsScreenTimePermission';

const mocks = vi.hoisted(() => ({
  status: 0,
  request: vi.fn(),
  alert: vi.fn(),
  listener: undefined as undefined | ((state: string) => void),
}));
vi.mock('expo-router', async () => {
  const { useEffect } = await import('react');
  return { useFocusEffect: (callback: () => () => void) => useEffect(callback, [callback]) };
});
vi.mock('react-native-device-activity', () => ({
  AuthorizationStatus: { notDetermined: 0, denied: 1, approved: 2 },
  getAuthorizationStatus: () => mocks.status,
  requestAuthorization: mocks.request,
  onAuthorizationStatusChange: () => ({ remove: vi.fn() }),
}));
vi.mock('react-native', () => ({
  Alert: { alert: mocks.alert },
  Linking: { openSettings: vi.fn() },
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
vi.mock('@/api/errors', () => ({
  normalizeError: (error: Error) => error,
  logError: vi.fn(),
  getUserErrorMessage: (error: Error) => error.message,
}));
Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
const cleanup: (() => void)[] = [];
beforeEach(() => {
  vi.clearAllMocks();
  mocks.status = 0;
});
afterEach(async () => {
  await act(() => cleanup.splice(0).forEach((fn) => fn()));
});
async function setup() {
  let state!: ReturnType<typeof useSettingsScreenTimePermission>;
  function Harness() {
    state = useSettingsScreenTimePermission();
    return null;
  }
  const root = createRoot(document.createElement('div'));
  cleanup.push(() => root.unmount());
  await act(() => root.render(createElement(Harness)));
  return {
    get state() {
      return state;
    },
  };
}
it('권한 요청과 복귀가 겹쳐도 중복 요청하지 않고 승인 결과를 표시한다', async () => {
  const screen = await setup();
  const requested = Promise.withResolvers<void>();
  mocks.request.mockReturnValueOnce(requested.promise);
  let pending!: Promise<void>;
  await act(() => {
    pending = screen.state.request();
  });
  await act(() => screen.state.request());
  expect(mocks.request).toHaveBeenCalledOnce();
  await act(async () => {
    mocks.status = 2;
    mocks.listener?.('active');
    requested.resolve();
    await pending;
  });
  expect(screen.state.granted).toBe(true);
  expect(screen.state.pending).toBe(false);
  expect(mocks.alert).not.toHaveBeenCalled();
});
it('이미 거절한 권한은 재요청 없이 설정을 안내하고 복귀 때 승인·철회를 반영한다', async () => {
  mocks.status = 1;
  const screen = await setup();
  await act(() => screen.state.request());
  expect(mocks.request).not.toHaveBeenCalled();
  expect(mocks.alert).toHaveBeenCalled();
  await act(() => {
    mocks.status = 2;
    mocks.listener?.('active');
  });
  expect(screen.state.granted).toBe(true);
  await act(() => {
    mocks.status = 1;
    mocks.listener?.('active');
  });
  expect(screen.state.granted).toBe(false);
});
