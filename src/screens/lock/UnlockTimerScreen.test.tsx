// @vitest-environment jsdom
import { act, createElement, type ReactNode } from 'react';
import { createRoot } from 'react-dom/client';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';

import UnlockTimerScreen from './UnlockTimerScreen';

const mocks = vi.hoisted(() => ({
  appId: 'selected-app' as string | undefined,
  hydrated: false,
  finishHydration: () => {},
  lockedApps: [] as { id: string }[],
  replace: vi.fn(),
  preview: vi.fn(),
  syncNames: vi.fn(),
  resetOverLimit: vi.fn(),
}));
vi.mock('expo-router', () => ({
  useLocalSearchParams: () => ({ appId: mocks.appId }),
  useRouter: () => ({ replace: mocks.replace }),
  Redirect: ({ href }: { href: string }) => createElement('span', {}, href),
}));
vi.mock('../../stores/lockStore', () => ({
  useLockStore: Object.assign(
    () => ({ lockedApps: mocks.lockedApps, familyActivitySelectionsByAppId: {} }),
    {
      persist: {
        hasHydrated: () => mocks.hydrated,
        onFinishHydration: (callback: () => void) => {
          mocks.finishHydration = callback;
          return () => {};
        },
      },
    }
  ),
}));
vi.mock('../../../modules/screen-time-report', () => ({
  minimizeApp: vi.fn(),
  ScreenTimeReportView: () => null,
}));
vi.mock('../../lib/sharedDisplayConfig', () => ({
  syncUnlockNoticeNames: mocks.syncNames,
  resetOverLimitExceeded: mocks.resetOverLimit,
}));
vi.mock('../../api', () => ({
  getAppLockNotification: () => ({ previewRemovalRecipients: mocks.preview }),
}));
vi.mock('../../lib/token', () => ({ spacing: { 16: 16 } }));
vi.mock('react-native', () => ({
  View: ({ children }: { children: ReactNode }) => children,
  ActivityIndicator: () => createElement('span', {}, '불러오는 중'),
  StyleSheet: { create: (styles: unknown) => styles },
}));
vi.mock('react-native-safe-area-context', () => ({
  SafeAreaView: ({ children }: { children: ReactNode }) => children,
}));
vi.mock('./TenSecondCountdownScreen', () => ({
  TenSecondCountdownScreen: ({ onComplete }: { onComplete: () => void }) =>
    createElement('button', { onClick: onComplete }, '타이머 완료'),
}));
Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });

let container: HTMLDivElement;
let root: ReturnType<typeof createRoot>;
beforeEach(() => {
  vi.clearAllMocks();
  mocks.preview.mockResolvedValue({ recipients: [] });
  mocks.appId = 'selected-app';
  mocks.hydrated = false;
  mocks.lockedApps = [];
  container = document.createElement('div');
  root = createRoot(container);
});
afterEach(async () => {
  await act(() => root.unmount());
});

it('앱 목록 복원 전에는 해제 여부를 결정하지 않고 복원된 앱을 다음 단계까지 유지한다', async () => {
  await act(() => root.render(createElement(UnlockTimerScreen)));
  expect(container.textContent).toBe('불러오는 중');
  await act(() => {
    mocks.lockedApps = [{ id: 'selected-app' }];
    mocks.hydrated = true;
    mocks.finishHydration();
  });
  expect(container.textContent).toBe('타이머 완료');
  await act(() => container.querySelector('button')!.click());
  expect(mocks.replace).toHaveBeenCalledWith({
    pathname: '/(lock)/unlock-duration',
    params: { appId: 'selected-app', recipientUserIds: '' },
  });
});

it('선택한 앱이 등록 해제됐으면 다른 등록 앱의 해제 타이머를 시작하지 않는다', async () => {
  mocks.hydrated = true;
  mocks.lockedApps = [{ id: 'another-app' }];
  await act(() => root.render(createElement(UnlockTimerScreen)));
  expect(container.textContent).toBe('/(tabs)/restricted-apps');
  expect(container.querySelector('button')).toBeNull();
});

it('서버가 뽑은 친구 이름을 리포트 확장에 전달하고, 조회에 실패하면 이름을 비워 이전 이름이 남지 않게 한다', async () => {
  mocks.hydrated = true;
  mocks.lockedApps = [{ id: 'selected-app' }];
  mocks.preview.mockResolvedValue({
    recipients: [
      { userId: 7, displayName: '지민' },
      { userId: 9, displayName: '서연' },
    ],
  });
  await act(async () => {
    root.render(createElement(UnlockTimerScreen));
  });
  expect(mocks.syncNames).toHaveBeenNthCalledWith(1, []);
  expect(mocks.syncNames).toHaveBeenLastCalledWith(['지민', '서연']);

  await act(() => root.unmount());
  vi.clearAllMocks();
  mocks.preview.mockRejectedValue(new Error('network'));
  root = createRoot(container);
  await act(async () => {
    root.render(createElement(UnlockTimerScreen));
  });
  expect(mocks.syncNames).toHaveBeenCalledTimes(1);
  expect(mocks.syncNames).toHaveBeenCalledWith([]);
});

it('들어올 때 이전 제한 초과 값을 지우고, 보여 준 친구의 ID를 해제 시간 설정 화면에 전달한다', async () => {
  mocks.hydrated = true;
  mocks.lockedApps = [{ id: 'selected-app' }];
  mocks.preview.mockResolvedValue({
    recipients: [
      { userId: 7, displayName: '지민' },
      { userId: 9, displayName: '서연' },
    ],
  });
  await act(async () => {
    root.render(createElement(UnlockTimerScreen));
  });
  expect(mocks.resetOverLimit).toHaveBeenCalledTimes(1);
  await act(() => container.querySelector('button')!.click());
  expect(mocks.replace).toHaveBeenCalledWith({
    pathname: '/(lock)/unlock-duration',
    params: { appId: 'selected-app', recipientUserIds: '7,9' },
  });
});
