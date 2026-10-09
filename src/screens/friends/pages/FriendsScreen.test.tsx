// @vitest-environment jsdom
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, createElement, type ReactNode } from 'react';
import { createRoot } from 'react-dom/client';
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import axios, { type AxiosRequestConfig } from 'axios';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import {
  friendsHandlers,
  FRIENDS_MOCK_ORIGIN,
  resetFriendsMockData,
} from '../../../mocks/friendsHandlers';
import { normalizeError } from '../../../api/errors/normalizeError';

import type { FriendResponse } from '../../../api/query-generated/model';
import FriendsScreen from './FriendsScreen';

const api = vi.hoisted(() => ({
  friends: vi.fn(),
  requests: vi.fn(),
  useHttp: false,
  changeQuery: undefined as ((value: string) => void) | undefined,
}));
vi.mock('../../../api/friendMutator', () => ({
  friendAxios: (config: AxiosRequestConfig) =>
    api.useHttp
      ? axios({ ...config, baseURL: FRIENDS_MOCK_ORIGIN })
          .then((response) => response.data)
          .catch((error) => {
            throw normalizeError(error);
          })
      : config.url === '/friends'
        ? api.friends()
        : api.requests(),
}));
vi.mock('../hooks/useShareFriendInvite', () => ({
  useShareFriendInvite: () => ({ share: vi.fn(), sharing: false }),
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
    TextInput: ({
      value,
      onChangeText,
    }: {
      value: string;
      onChangeText: (text: string) => void;
    }) => {
      api.changeQuery = onChangeText;
      return createElement('input', {
        value,
        onChange: (event: { target: { value: string } }) => onChangeText(event.target.value),
      });
    },
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
  user: {
    userId: 8,
    displayName: '복구된 친구',
    userCode: 'ABCDE',
    profileImageUrl: null,
    relationshipStatus: 'FRIEND',
    requestId: null,
  },
  acceptedAt: '2026-10-09T10:00:00',
};
const request = {
  requestId: 72,
  user: {
    ...friend.user,
    userId: 9,
    displayName: '유지할 요청',
    userCode: 'FGHJK',
    relationshipStatus: 'PENDING_RECEIVED' as const,
    requestId: 72,
  },
  createdAt: '2026-10-09T09:00:00',
};
const cleanups: (() => void)[] = [];
const server = setupServer(...friendsHandlers);
beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterAll(() => server.close());

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((res) => {
    resolve = res;
  });
  return { promise, resolve };
}

beforeEach(() => {
  vi.resetAllMocks();
  api.useHttp = false;
  resetFriendsMockData({ latencyMs: 0 });

  vi.spyOn(console, 'error').mockImplementation(() => undefined);
  api.requests.mockImplementation(async () => [request]);
});
afterEach(async () => {
  await act(() => cleanups.splice(0).forEach((cleanup) => cleanup()));
  vi.restoreAllMocks();
  vi.useRealTimers();
  server.resetHandlers();
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
      // 필수 ID가 누락된 외부 응답을 의도적으로 주입해 복구를 검증한다.
      // @ts-expect-error 잘못된 서버 응답
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

describe('MSW 응답 순서와 초대코드 검색', () => {
  it('표시된 검색 카드의 입력을 수정하면 debounce 중 이전 대상에 요청할 수 없다', async () => {
    api.useHttp = true;
    const screen = await setup();
    await vi.waitFor(async () => {
      await act(async () => {});
      expect(screen.container.textContent).toContain('김서연');
    });
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
    await act(() => api.changeQuery!('a2b3c'));
    await act(() => vi.advanceTimersByTimeAsync(350));
    vi.useRealTimers();
    await vi.waitFor(async () => {
      await act(async () => {});
      expect(screen.container.textContent).toContain('홍길동');
      expect(screen.container.textContent).toContain('친구 요청 보내기');
    });
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
    await act(() => api.changeQuery!('n4da7'));
    expect(screen.container.textContent).not.toContain('홍길동');
    expect(screen.container.textContent).not.toContain('친구 요청 보내기');
    await act(() => vi.advanceTimersByTimeAsync(200));
    await act(() => api.changeQuery!('x5qa9'));
    await act(() => vi.advanceTimersByTimeAsync(350));
    vi.useRealTimers();
    await vi.waitFor(async () => {
      await act(async () => {});
      expect(screen.container.textContent).toContain('이서진');
      expect(screen.container.textContent).not.toContain('김다은');
    });
  });

  it('입력을 바꾸면 이전 결과를 즉시 숨기고 늦은 응답 뒤에도 새 대상에게만 요청한다', async () => {
    api.useHttp = true;
    const previousStarted = deferred<void>();
    const previousResult = deferred<void>();
    const writes: number[] = [];
    server.use(
      http.get(`${FRIENDS_MOCK_ORIGIN}/friends/search`, async ({ request }) => {
        const code = new URL(request.url).searchParams.get('userCode');
        if (code === 'A2B3C') {
          previousStarted.resolve();
          await previousResult.promise;
          return HttpResponse.json({
            userId: 1201,
            displayName: '이전 대상',
            relationshipStatus: 'NONE',
          });
        }
        return HttpResponse.json({
          userId: 1202,
          displayName: '새 대상',
          relationshipStatus: 'NONE',
        });
      }),
      http.post(`${FRIENDS_MOCK_ORIGIN}/friends/requests`, async ({ request }) => {
        const { targetUserId } = (await request.json()) as { targetUserId: number };
        writes.push(targetUserId);
        return HttpResponse.json({ requestId: 9002 }, { status: 201 });
      })
    );
    const screen = await setup();
    await vi.waitFor(async () => {
      await act(async () => {});
      expect(screen.container.textContent).toContain('김서연');
    });
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
    await act(() => api.changeQuery!('a2b3c'));
    await act(() => vi.advanceTimersByTimeAsync(350));
    vi.useRealTimers();
    await previousStarted.promise;

    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
    await act(() => api.changeQuery!('n4da7'));
    expect(screen.container.textContent).not.toContain('친구 요청 보내기');
    await act(() => vi.advanceTimersByTimeAsync(350));
    vi.useRealTimers();
    await vi.waitFor(async () => {
      await act(async () => {});
      expect(screen.container.textContent).toContain('새 대상');
    });
    await act(() => previousResult.resolve());
    expect(screen.container.textContent).not.toContain('이전 대상');
    await act(() =>
      Array.from(screen.container.querySelectorAll('button'))
        .find((button) => button.textContent === '친구 요청 보내기')!
        .click()
    );
    await vi.waitFor(async () => {
      await act(async () => {});
      expect(screen.container.textContent).toContain('요청됨');
    });
    expect(writes).toEqual([1202]);
  });
});
