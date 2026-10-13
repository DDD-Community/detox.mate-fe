// @vitest-environment jsdom
import { act, createElement } from 'react';
import { createRoot } from 'react-dom/client';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { SettingsAccountDialog } from './SettingsAccountDialog';

const mocks = vi.hoisted(() => ({
  withdraw: vi.fn(),
  logout: vi.fn(),
  clearAuth: vi.fn(),
  clearLocalData: vi.fn(),
  removeKey: vi.fn(),
  unregister: vi.fn(),
  clearPush: vi.fn(),
  replace: vi.fn(),
  toast: vi.fn(),
  log: vi.fn(),
  dialog: undefined as
    | undefined
    | { onConfirm: () => Promise<void>; onClose: () => void; loading: boolean },
}));
vi.mock('@/api/client');
vi.mock('@/lib/clearLocalUserData', () => ({ clearLocalUserData: mocks.clearLocalData }));
vi.mock('@/api/auth', () => ({ logout: mocks.logout, clearAuthSession: mocks.clearAuth }));
vi.mock('@/api/generated/user/user', () => ({ getUser: () => ({ withdraw: mocks.withdraw }) }));
vi.mock('expo-router', () => ({ router: { replace: mocks.replace } }));
vi.mock('expo-secure-store', () => ({ deleteItemAsync: mocks.removeKey }));
vi.mock('@/lib/fcmToken', () => ({
  unregisterDevicePushToken: mocks.unregister,
  clearStoredDevicePushToken: mocks.clearPush,
}));
vi.mock('@/api/errors', () => ({
  normalizeError: (error: Error) => ({ type: 'unknown', message: error.message }),
  logError: mocks.log,
  getUserErrorMessage: (error: Error) => error.message,
}));
vi.mock('@/stores/networkErrorToastStore', () => ({
  useNetworkErrorToastStore: { getState: () => ({ showMessage: mocks.toast }) },
}));
vi.mock('./WithdrawConfirmAlert', () => ({
  WithdrawConfirmAlert: (props: typeof mocks.dialog) => {
    mocks.dialog = props;
    return null;
  },
}));
vi.mock('./LogoutConfirmAlert', () => ({
  LogoutConfirmAlert: (props: typeof mocks.dialog) => {
    mocks.dialog = props;
    return null;
  },
}));
Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
const cleanup: (() => void)[] = [];
beforeEach(() => {
  vi.resetAllMocks();
});
afterEach(async () => {
  await act(() => cleanup.splice(0).forEach((fn) => fn()));
});
async function setup(action: 'withdraw' | 'logout' = 'withdraw') {
  const root = createRoot(document.createElement('div'));
  const close = vi.fn();
  cleanup.push(() => root.unmount());
  await act(() =>
    root.render(
      createElement(SettingsAccountDialog, {
        action,
        visible: true,
        onClose: close,
        onDismiss: vi.fn(),
      })
    )
  );
  return { close };
}
it('탈퇴가 실패하면 세션과 푸시 등록을 보존하고 다시 시도할 수 있다', async () => {
  const screen = await setup();
  mocks.withdraw.mockRejectedValueOnce(new Error('탈퇴 실패'));
  await act(() => mocks.dialog!.onConfirm());
  expect(mocks.clearLocalData).not.toHaveBeenCalled();
  expect(mocks.clearAuth).not.toHaveBeenCalled();
  expect(mocks.unregister).not.toHaveBeenCalled();
  expect(mocks.clearPush).not.toHaveBeenCalled();
  expect(screen.close).not.toHaveBeenCalled();
  expect(mocks.dialog!.loading).toBe(false);
  expect(mocks.toast).toHaveBeenCalled();
  await act(() => mocks.dialog!.onConfirm());
  expect(mocks.clearAuth).toHaveBeenCalledOnce();
  expect(screen.close).toHaveBeenCalledOnce();
});
it('탈퇴 처리 중 중복 요청과 취소를 막고 로컬 정리 실패에도 삭제를 재요청하지 않는다', async () => {
  const screen = await setup();
  const deleted = Promise.withResolvers<void>();
  mocks.withdraw.mockReturnValueOnce(deleted.promise);
  mocks.removeKey.mockRejectedValue(new Error('저장소 실패'));
  let pending!: Promise<void>;
  await act(() => {
    pending = mocks.dialog!.onConfirm();
  });
  await act(async () => {
    await mocks.dialog!.onConfirm();
    mocks.dialog!.onClose();
  });
  expect(mocks.withdraw).toHaveBeenCalledOnce();
  expect(screen.close).not.toHaveBeenCalled();
  await act(async () => {
    deleted.resolve();
    await pending;
  });
  expect(mocks.clearAuth).toHaveBeenCalledOnce();
  expect(mocks.clearPush).toHaveBeenCalledOnce();
  expect(mocks.clearLocalData).toHaveBeenCalledOnce();
  expect(mocks.clearLocalData.mock.invocationCallOrder[0]).toBeLessThan(
    mocks.clearAuth.mock.invocationCallOrder[0]
  );
  expect(screen.close).toHaveBeenCalledOnce();
  expect(mocks.replace).toHaveBeenCalledWith('/');
  expect(mocks.log).toHaveBeenCalled();
});
it('푸시 토큰 삭제가 실패해도 로그아웃과 로그인 화면 이동을 진행한다', async () => {
  const screen = await setup('logout');
  mocks.unregister.mockRejectedValueOnce(new Error('토큰 삭제 실패'));
  await act(() => mocks.dialog!.onConfirm());
  expect(mocks.logout).toHaveBeenCalledOnce();
  expect(screen.close).toHaveBeenCalledOnce();
  expect(mocks.replace).toHaveBeenCalledWith('/(auth)/login');
});
