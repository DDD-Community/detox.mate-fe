// @vitest-environment jsdom
import { act, createElement, type ReactNode } from 'react';
import { createRoot } from 'react-dom/client';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';

import UnregisterTimerScreen from './UnregisterTimerScreen';

const mocks = vi.hoisted(() => ({
  replace: vi.fn(),
  preview: vi.fn(),
  getMe: vi.fn(),
}));
vi.mock('expo-router', () => ({
  useLocalSearchParams: () => ({ appId: 'selected-app' }),
  useRouter: () => ({ replace: mocks.replace, back: vi.fn() }),
}));
vi.mock('../../api', () => ({
  getUser: () => ({ getMe: mocks.getMe }),
  getAppLockNotification: () => ({ previewRemovalRecipients: mocks.preview }),
}));
vi.mock('../../lib/token', () => ({ spacing: { 16: 16 } }));
vi.mock('react-native', () => ({
  View: ({ children }: { children: ReactNode }) => children,
  StyleSheet: { create: (styles: unknown) => styles },
}));
vi.mock('react-native-safe-area-context', () => ({
  SafeAreaView: ({ children }: { children: ReactNode }) => children,
}));
vi.mock('./TenSecondCountdownScreen', () => ({
  TenSecondCountdownScreen: ({
    notifiedFriends,
    notificationPreview,
    onComplete,
  }: {
    notifiedFriends?: string[];
    notificationPreview?: string;
    onComplete: () => void;
  }) =>
    createElement(
      'button',
      { onClick: onComplete },
      `${notifiedFriends?.join(',') ?? '안내 없음'}|${notificationPreview ?? '미리보기 없음'}`
    ),
}));
Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });

let container: HTMLDivElement;
let root: ReturnType<typeof createRoot>;
beforeEach(() => {
  vi.clearAllMocks();
  mocks.getMe.mockResolvedValue({ displayName: '한빈' });
  container = document.createElement('div');
  root = createRoot(container);
});
afterEach(async () => {
  await act(() => root.unmount());
});

async function render() {
  await act(async () => {
    root.render(createElement(UnregisterTimerScreen));
  });
}

it('서버가 뽑은 수신자 이름을 안내하고, 완료하면 그 친구의 ID를 다음 화면에 전달한다', async () => {
  mocks.preview.mockResolvedValue({
    recipients: [
      { userId: 7, displayName: '지민' },
      { userId: 9, displayName: '서연' },
    ],
  });
  await render();
  expect(container.textContent).toBe('지민,서연|한빈님이 앱을 등록 해제했어요.');
  await act(() => container.querySelector('button')!.click());
  expect(mocks.replace).toHaveBeenCalledWith({
    pathname: '/(lock)/unregister-reason',
    params: { appId: 'selected-app', recipientUserIds: '7,9' },
  });
});

it('알림을 받을 친구가 없으면 안내와 미리보기를 숨기고 빈 ID를 전달한다', async () => {
  mocks.preview.mockResolvedValue({ recipients: [] });
  await render();
  expect(container.textContent).toBe('안내 없음|미리보기 없음');
  await act(() => container.querySelector('button')!.click());
  expect(mocks.replace).toHaveBeenCalledWith({
    pathname: '/(lock)/unregister-reason',
    params: { appId: 'selected-app', recipientUserIds: '' },
  });
});

it('수신자 조회가 실패해도 안내를 숨기고 등록 해제 흐름은 계속된다', async () => {
  mocks.preview.mockRejectedValue(new Error('network'));
  await render();
  expect(container.textContent).toBe('안내 없음|미리보기 없음');
  await act(() => container.querySelector('button')!.click());
  expect(mocks.replace).toHaveBeenCalledTimes(1);
});
