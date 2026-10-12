// @vitest-environment jsdom
import { act, createElement, type PropsWithChildren } from 'react';
import { createRoot } from 'react-dom/client';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { router } from 'expo-router';
import SelectAppsScreen from './SelectAppsScreen';
import OnboardingSelectAppsScreen from '../onboarding/OnboardingSelectAppsScreen';

const routerMock = vi.mocked(router);
const mocks = vi.hoisted(() => ({
  release: vi.fn(),
  unregister: vi.fn(),
  initialToken: null as string | null,
  storedSelections: {} as Record<string, string>,
  difference: vi.fn(),
  deselected: vi.fn(),
  authorizationStatus: vi.fn(),
  requestAuthorization: vi.fn(),
  lock: vi.fn(),
  register: vi.fn(),
  selection: undefined as
    | undefined
    | ((event: {
        nativeEvent: {
          familyActivitySelection: string | null;
          applicationCount: number;
          categoryCount: number;
          webDomainCount: number;
        };
      }) => void),
  done: undefined as undefined | (() => void),
}));
vi.mock('../../lib/token/icons', () => ({ iconNames: [] }));
vi.mock('expo-router');
vi.mock('react-native', () => ({
  View: ({ children }: PropsWithChildren) => createElement('div', null, children),
  Text: ({ children }: PropsWithChildren) => createElement('span', null, children),
  Pressable: ({
    children,
    disabled,
    onPress,
  }: PropsWithChildren<{ disabled?: boolean; onPress: () => void }>) => {
    mocks.done = onPress;
    return createElement('button', { disabled, onClick: onPress }, children);
  },
  StyleSheet: { create: (styles: unknown) => styles },
  useColorScheme: () => 'light',
  Alert: { alert: vi.fn() },
}));
vi.mock('react-native-safe-area-context', () => ({
  SafeAreaView: ({ children }: PropsWithChildren) => children,
}));
vi.mock('react-native-device-activity', () => ({
  AuthorizationStatus: { approved: 2 },
  getAuthorizationStatus: mocks.authorizationStatus,
  requestAuthorization: mocks.requestAuthorization,
  updateShield: vi.fn(),
  reloadDeviceActivityCenter: vi.fn(),
  DeviceActivitySelectionView: ({
    onSelectionChange,
  }: {
    onSelectionChange: typeof mocks.selection;
  }) => {
    mocks.selection = onSelectionChange;
    return null;
  },
}));
vi.mock('../../lib/familyActivitySelections', () => ({
  unionTokens: () => mocks.initialToken,
  differenceTokens: mocks.difference,
  tokensOverlap: vi.fn(),
}));
vi.mock('../../lib/lockRegistration', () => ({
  lockApp: mocks.lock,
  releaseAppLock: mocks.release,
}));
vi.mock('../../lib/lockSelectionDiff', () => ({ findDeselectedAppIds: mocks.deselected }));
vi.mock('../../lib/shieldConfig', () => ({ SHIELD_ACTIONS: {}, SHIELD_CONFIGURATION: {} }));
vi.mock('../../../modules/screen-time-report', () => ({
  splitSelection: () => ['app-one', 'app-two'],
}));
vi.mock('../../stores/lockStore', () => ({
  useLockStore: () => ({
    selectedAppIds: [],
    familyActivitySelectionsByAppId: mocks.storedSelections,
    registerAppSelection: mocks.register,
    unregisterApp: mocks.unregister,
  }),
}));
vi.mock('@/api/errors', () => ({
  getUserErrorMessage: () => '',
  logError: vi.fn(),
  normalizeError: (e: unknown) => e,
}));
vi.mock('@/components', () => ({ LoggingPage: ({ children }: PropsWithChildren) => children }));
Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
beforeEach(() => {
  vi.clearAllMocks();
  mocks.initialToken = null;
  mocks.storedSelections = {};
  mocks.difference.mockReturnValue(null);
  mocks.deselected.mockReturnValue([]);
  mocks.authorizationStatus.mockReturnValue(2);
});
afterEach(() => vi.restoreAllMocks());
it('빈 선택을 막고 선택된 앱을 즉시 잠근 뒤 목표 화면으로 한 번만 이동한다', async () => {
  const element = document.createElement('div');
  const root = createRoot(element);
  try {
    await act(() => root.render(createElement(OnboardingSelectAppsScreen)));
    expect(element.querySelector('button')?.disabled).toBe(true);
    await act(() => mocks.done?.());
    expect(routerMock.replace).not.toHaveBeenCalled();
    expect(mocks.lock).not.toHaveBeenCalled();
    vi.spyOn(Date, 'now').mockReturnValue(Date.now() + 2000);
    await act(() =>
      mocks.selection?.({
        nativeEvent: {
          familyActivitySelection: 'encoded-empty',
          applicationCount: 0,
          categoryCount: 0,
          webDomainCount: 0,
        },
      })
    );
    expect(element.querySelector('button')?.disabled).toBe(true);
    await act(() =>
      mocks.selection?.({
        nativeEvent: {
          familyActivitySelection: 'two-apps',
          applicationCount: 2,
          categoryCount: 0,
          webDomainCount: 0,
        },
      })
    );
    expect(element.querySelector('button')?.disabled).toBe(false);
    await act(() => {
      mocks.done?.();
      mocks.done?.();
    });
    expect(mocks.lock).toHaveBeenCalledTimes(2);
    expect(mocks.register).toHaveBeenCalledTimes(2);
    expect(routerMock.replace).toHaveBeenCalledExactlyOnceWith('/onboarding-goal');
    expect(mocks.lock.mock.invocationCallOrder[1]).toBeLessThan(
      routerMock.replace.mock.invocationCallOrder[0]
    );
  } finally {
    await act(() => root.unmount());
  }
});

it('일반 앱 선택은 새 앱을 잠근 뒤 기존 목표 시간 화면으로 이동한다', async () => {
  const root = createRoot(document.createElement('div'));
  try {
    await act(() => root.render(createElement(SelectAppsScreen)));
    await act(() =>
      mocks.selection?.({
        nativeEvent: {
          familyActivitySelection: 'two-apps',
          applicationCount: 2,
          categoryCount: 0,
          webDomainCount: 0,
        },
      })
    );
    await act(() => {
      mocks.done?.();
      mocks.done?.();
    });
    expect(mocks.lock).toHaveBeenCalledTimes(2);
    expect(routerMock.replace).toHaveBeenCalledExactlyOnceWith('/(lock)/goal-time');
    expect(mocks.lock.mock.invocationCallOrder[1]).toBeLessThan(
      routerMock.replace.mock.invocationCallOrder[0]
    );
  } finally {
    await act(() => root.unmount());
  }
});

it.each([
  ['온보딩', OnboardingSelectAppsScreen, '/onboarding-goal'],
  ['일반 앱 선택', SelectAppsScreen, null],
] as const)(
  '%s은 기존 선택 그대로 완료해도 자신의 완료 경로를 유지한다',
  async (_, Screen, destination) => {
    mocks.initialToken = 'existing-app';
    const root = createRoot(document.createElement('div'));
    try {
      await act(() => root.render(createElement(Screen)));
      await act(() => mocks.done?.());
      expect(mocks.lock).not.toHaveBeenCalled();
      if (destination) expect(routerMock.replace).toHaveBeenCalledExactlyOnceWith(destination);
      else expect(routerMock.back).toHaveBeenCalledTimes(1);
    } finally {
      await act(() => root.unmount());
    }
  }
);

it('일반 앱 선택에서 전체 해제하면 잠금과 등록을 제거한 뒤 이전 화면으로 돌아간다', async () => {
  mocks.initialToken = 'existing-app';
  mocks.storedSelections = { 'app-1': 'existing-app' };
  mocks.deselected.mockReturnValue(['app-1']);
  const root = createRoot(document.createElement('div'));
  try {
    await act(() => root.render(createElement(SelectAppsScreen)));
    vi.spyOn(Date, 'now').mockReturnValue(Date.now() + 2000);
    await act(() =>
      mocks.selection?.({
        nativeEvent: {
          familyActivitySelection: null,
          applicationCount: 0,
          categoryCount: 0,
          webDomainCount: 0,
        },
      })
    );
    await act(() => mocks.done?.());
    expect(mocks.release).toHaveBeenCalledExactlyOnceWith('app-1', 'existing-app');
    expect(mocks.unregister).toHaveBeenCalledExactlyOnceWith('app-1');
    expect(routerMock.back).toHaveBeenCalledTimes(1);
    expect(mocks.unregister.mock.invocationCallOrder[0]).toBeLessThan(
      routerMock.back.mock.invocationCallOrder[0]
    );
    expect(routerMock.replace).not.toHaveBeenCalled();
  } finally {
    await act(() => root.unmount());
  }
});

it.each([
  ['온보딩', OnboardingSelectAppsScreen, false],
  ['일반 앱 선택', SelectAppsScreen, true],
] as const)(
  '%s에서 권한을 거절하면 해당 화면의 진행 정책을 따른다',
  async (_, Screen, goesBack) => {
    mocks.authorizationStatus.mockReturnValue(0);
    mocks.requestAuthorization.mockRejectedValueOnce(new Error('denied'));
    const element = document.createElement('div');
    const root = createRoot(element);
    try {
      await act(() => root.render(createElement(Screen)));
      expect(routerMock.back).toHaveBeenCalledTimes(goesBack ? 1 : 0);
      expect(routerMock.replace).not.toHaveBeenCalled();
      if (!goesBack) {
        expect(element.textContent).toContain('다시 시도');
        mocks.authorizationStatus.mockReturnValue(2);
        await act(() =>
          Array.from(element.querySelectorAll('button'))
            .find((button) => button.textContent?.includes('다시 시도'))!
            .click()
        );
        expect(element.textContent).not.toContain('다시 시도');
      }
    } finally {
      await act(() => root.unmount());
    }
  }
);
