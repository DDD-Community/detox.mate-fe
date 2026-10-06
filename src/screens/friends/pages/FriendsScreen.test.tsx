// @vitest-environment jsdom
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, createElement, type ReactNode } from 'react';
import { createRoot } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { FriendResponse } from '../../../api/query-generated/model';
import FriendsScreen from './FriendsScreen';

const api = vi.hoisted(() => ({ friends: vi.fn(), requests: vi.fn() }));
vi.mock('../../../api/friendMutator', () => ({
  friendAxios: ({ url }: { url: string }) => (url === '/friends' ? api.friends() : api.requests()),
}));
vi.mock('../../../api/errors/logger', () => ({ logError: vi.fn() }));
vi.mock('../../../lib/analytics', () => ({ trackEvent: vi.fn(), trackButtonClick: vi.fn() }));
vi.mock('../../../lib/navigation', () => ({ goBackOrReplace: vi.fn() }));
vi.mock('../../../components/LoggingPage', () => ({
  LoggingPage: ({ children }: { children: ReactNode }) => children,
}));
vi.mock('../../../lib/token/icons', () => ({ iconNames: [] }));
vi.mock('expo-router', () => ({ router: { replace: vi.fn() } }));
vi.mock('expo-image', () => ({ Image: () => null }));
vi.mock('expo-secure-store', () => ({ getItemAsync: vi.fn() }));
vi.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, right: 0, bottom: 0, left: 0 }),
}));
vi.mock('react-native-svg', () => ({
  default: () => null,
  Defs: () => null,
  LinearGradient: () => null,
  Rect: () => null,
  Stop: () => null,
}));
vi.mock('react-native', async () => {
  const { createElement } = await import('react');
  const view = ({ children }: { children: ReactNode }) => createElement('div', {}, children);
  return {
    View: view,
    KeyboardAvoidingView: view,
    ScrollView: view,
    Modal: ({ children, visible }: { children: ReactNode; visible: boolean }) =>
      visible ? view({ children }) : null,
    Text: ({ children }: { children: ReactNode }) => createElement('span', {}, children),
    TextInput: ({ value, onChangeText }: { value: string; onChangeText: (text: string) => void }) =>
      createElement('input', {
        value,
        onChange: (event: { target: { value: string } }) => onChangeText(event.target.value),
      }),
    Pressable: ({ children, onPress }: { children: ReactNode; onPress: () => void }) =>
      createElement('button', { onClick: onPress }, children),
    ActivityIndicator: ({ accessibilityLabel }: { accessibilityLabel: string }) =>
      createElement('span', { role: 'status' }, accessibilityLabel),
    RefreshControl: () => null,
    Alert: { alert: vi.fn() },
    Keyboard: { dismiss: vi.fn(), addListener: () => ({ remove: vi.fn() }) },
    Platform: { OS: 'ios' },
    StyleSheet: { create: (styles: unknown) => styles, absoluteFillObject: {}, absoluteFill: {} },
  };
});
Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });

const friend: FriendResponse = {
  friendshipId: 41,
  user: { userId: 8, displayName: '복구된 친구' },
};
const request = { requestId: 72, user: { userId: 9, displayName: '유지할 요청' } };
const cleanups: (() => void)[] = [];

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((res) => {
    resolve = res;
  });
  return { promise, resolve };
}

beforeEach(() => {
  vi.resetAllMocks();

  vi.spyOn(console, 'error').mockImplementation(() => undefined);
  api.requests.mockImplementation(async () => [request]);
});
afterEach(async () => {
  await act(() => cleanups.splice(0).forEach((cleanup) => cleanup()));
  vi.restoreAllMocks();
});

async function setup() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const container = document.createElement('div');
  const root = createRoot(container);
  cleanups.push(() => {
    root.unmount();
    client.clear();
  });
  await act(async () => {
    root.render(createElement(QueryClientProvider, { client }, createElement(FriendsScreen)));
  });
  const retryButton = () =>
    Array.from(container.querySelectorAll('button')).find(
      (button) => button.textContent === '다시 시도'
    );
  return {
    container,
    retryButton,
    async retry() {
      const button = retryButton();
      expect(button).toBeDefined();
      await act(async () => {
        button!.dispatchEvent(new MouseEvent('click', { bubbles: true }));
      });
    },
  };
}

describe('친구 화면 새로고침으로 오류 복구', () => {
  it('잘못된 성공 응답 뒤 새로고침이 완료되면 친구 목록과 받은 요청을 다시 표시한다', async () => {
    api.friends.mockResolvedValueOnce([{ user: friend.user }]);
    const screen = await setup();
    expect(screen.retryButton()).toBeDefined();

    const retryRead = deferred<FriendResponse[]>();
    api.friends.mockReturnValueOnce(retryRead.promise);
    await screen.retry();
    // 잘못된 기존 캐시로 경계를 먼저 재렌더하지 않고 새 응답을 기다린다.
    expect(screen.retryButton()).toBeDefined();
    const refreshedRequest = { ...request, user: { ...request.user, displayName: '갱신된 요청' } };
    api.requests.mockResolvedValue([refreshedRequest]);
    await act(async () => {
      retryRead.resolve([{ user: friend.user }]);
    });
    expect(screen.retryButton()).toBeDefined();

    api.friends.mockResolvedValueOnce([friend]);
    await screen.retry();
    expect(screen.container.textContent).toContain(friend.user!.displayName);
    expect(screen.container.textContent).toContain(refreshedRequest.user.displayName);
    expect(screen.retryButton()).toBeUndefined();
  });

  it('초기 조회 실패 뒤 새로고침하면 친구 목록과 받은 요청을 다시 표시한다', async () => {
    api.friends.mockRejectedValueOnce(new Error('offline')).mockResolvedValueOnce([friend]);
    const screen = await setup();
    expect(screen.retryButton()).toBeDefined();
    await screen.retry();
    expect(screen.container.textContent).toContain(friend.user!.displayName);
    expect(screen.container.textContent).toContain(request.user.displayName);
    expect(screen.retryButton()).toBeUndefined();
  });
});
