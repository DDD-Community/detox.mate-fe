// @vitest-environment jsdom
import { act, createElement, type PropsWithChildren } from 'react';
import { createRoot } from 'react-dom/client';
import { afterEach, expect, it, vi } from 'vitest';
import SelectAppsScreen from './SelectAppsScreen';

const mocks = vi.hoisted(() => ({
  replace: vi.fn(),
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
vi.mock('expo-router', () => ({
  useRouter: () => ({ replace: mocks.replace }),
  useLocalSearchParams: () => ({ mode: 'onboarding' }),
}));
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
  getAuthorizationStatus: () => 2,
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
  unionTokens: () => null,
  differenceTokens: vi.fn(),
  tokensOverlap: vi.fn(),
}));
vi.mock('../../lib/lockRegistration', () => ({ lockApp: mocks.lock, releaseAppLock: vi.fn() }));
vi.mock('../../lib/lockSelectionDiff', () => ({ findDeselectedAppIds: () => [] }));
vi.mock('../../lib/shieldConfig', () => ({ SHIELD_ACTIONS: {}, SHIELD_CONFIGURATION: {} }));
vi.mock('../../../modules/screen-time-report', () => ({
  splitSelection: () => ['app-one', 'app-two'],
}));
vi.mock('../../stores/lockStore', () => ({
  useLockStore: () => ({
    selectedAppIds: [],
    familyActivitySelectionsByAppId: {},
    registerAppSelection: mocks.register,
    unregisterApp: vi.fn(),
  }),
}));
vi.mock('@/api/errors', () => ({
  getUserErrorMessage: () => '',
  logError: vi.fn(),
  normalizeError: (e: unknown) => e,
}));
vi.mock('@/components', () => ({ LoggingPage: ({ children }: PropsWithChildren) => children }));
Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
afterEach(() => vi.restoreAllMocks());
it('빈 선택을 막고 선택된 앱을 즉시 잠근 뒤 목표 화면으로 한 번만 이동한다', async () => {
  const element = document.createElement('div');
  const root = createRoot(element);
  try {
    await act(() => root.render(createElement(SelectAppsScreen)));
    expect(element.querySelector('button')?.disabled).toBe(true);
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
    expect(mocks.replace).toHaveBeenCalledExactlyOnceWith('/onboarding-goal');
    expect(mocks.lock.mock.invocationCallOrder[1]).toBeLessThan(
      mocks.replace.mock.invocationCallOrder[0]
    );
  } finally {
    await act(() => root.unmount());
  }
});
