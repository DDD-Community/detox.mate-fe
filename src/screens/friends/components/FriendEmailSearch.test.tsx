// @vitest-environment jsdom
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, createElement, type ReactNode } from 'react';
import { createRoot } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { AppError } from '../../../api/errors/normalizeError';
import { changeAuthQueryScope, getAuthQueryScope } from '../../../lib/query/authQueryScope';
import { searchQueryOptions } from '../utils/friendsQueryOptions';
import { FriendEmailSearch } from './FriendEmailSearch';

const mocks = vi.hoisted(() => ({ search: vi.fn(), log: vi.fn() }));
vi.mock('../../../api/friendMutator', () => ({ friendAxios: mocks.search }));
vi.mock('../../../api/errors/logger', () => ({ logError: mocks.log }));
vi.mock('../../../lib/analytics', () => ({ trackEvent: vi.fn() }));
vi.mock('../../../lib/token/icons', () => ({ iconNames: [] }));
vi.mock('expo-router', () => ({ router: { replace: vi.fn() } }));
vi.mock('expo-image', () => ({ Image: () => null }));
vi.mock('react-native-svg', () => ({
  default: () => null,
  Defs: () => null,
  LinearGradient: () => null,
  Rect: () => null,
  Stop: () => null,
}));
vi.mock('react-native', async () => {
  const { createElement } = await import('react');
  return {
    View: ({ children }: { children: ReactNode }) => createElement('div', {}, children),
    Text: ({ children }: { children: ReactNode }) => createElement('span', {}, children),
    Pressable: ({ children, onPress }: { children: ReactNode; onPress: () => void }) =>
      createElement('button', { onClick: onPress }, children),
    ActivityIndicator: () => createElement('span', { role: 'status' }),
    StyleSheet: { create: (styles: unknown) => styles, absoluteFill: {} },
  };
});
Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
const cleanups: (() => void)[] = [];
beforeEach(() => {
  vi.clearAllMocks();
  changeAuthQueryScope('1');
});
afterEach(async () => {
  await act(() => cleanups.splice(0).forEach((cleanup) => cleanup()));
});

async function mount(client: QueryClient) {
  const element = document.createElement('div');
  const caught = vi.fn();
  const root = createRoot(element, { onCaughtError: caught });
  let mounted = true;
  const unmount = () => {
    if (mounted) root.unmount();
    mounted = false;
  };
  cleanups.push(() => {
    unmount();
    client.clear();
  });
  await act(() =>
    root.render(
      createElement(
        QueryClientProvider,
        { client },
        createElement(FriendEmailSearch, {
          email: 'search@example.com',
          scope: getAuthQueryScope(),
          onReceived: vi.fn(),
          renderFriend: () => null,
          empty: createElement('span', {}, '일치하는 메일이 없어요.'),
        })
      )
    )
  );
  return { element, caught, unmount };
}

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason: unknown) => void;
  const promise = new Promise<T>((resolvePromise, rejectPromise) => {
    resolve = resolvePromise;
    reject = rejectPromise;
  });
  return { promise, resolve, reject };
}

const newClient = () =>
  new QueryClient({
    defaultOptions: { queries: { retry: false, retryOnMount: false, refetchOnMount: false } },
  });

describe('이메일 검색 실패의 정상 화면 복구', () => {
  it('초기 검색 없음은 예외 없이 대기를 끝내고 다시 진입한 검색은 새 결과로 복구한다', async () => {
    const client = newClient();
    const missing = AppError({ type: 'notFound', status: 404, code: 'NOT_FOUND' });
    const first = deferred<unknown>();
    mocks.search.mockReturnValue(first.promise);
    const options = searchQueryOptions('search@example.com', getAuthQueryScope());
    const screen = await mount(client);
    expect(screen.element.querySelector('[role="status"]')).not.toBeNull();
    await act(async () => {
      first.reject(missing);
      await first.promise.catch(() => undefined);
    });
    expect(screen.element.textContent).toContain('일치하는 메일이 없어요.');
    expect(screen.caught).not.toHaveBeenCalled();
    expect(mocks.log).not.toHaveBeenCalled();
    expect(client.getQueryState(options.queryKey)?.error).toBe(missing);

    // 실패 캐시의 재진입도 끝난 Promise를 반복 대기하지 않고 새 조회를 기다린다.
    await act(() => screen.unmount());
    const second = deferred<unknown>();
    mocks.search.mockReturnValue(second.promise);
    const reentered = await mount(client);
    expect(reentered.element.querySelector('[role="status"]')).not.toBeNull();
    await act(async () => {
      second.resolve({ userId: 2, displayName: '새 친구', relationshipStatus: 'NONE' });
      await second.promise;
    });
    expect(reentered.element.textContent).toContain('친구 요청 보내기');
    expect(reentered.element.querySelector('[role="status"]')).toBeNull();
    expect(reentered.caught).not.toHaveBeenCalled();
    expect(mocks.log).not.toHaveBeenCalled();
  });

  it('초기 서버 오류는 경계에서 기록하고 재시도하면 실제 조회로 복구한다', async () => {
    const client = newClient();
    const first = deferred<unknown>();
    mocks.search.mockReturnValue(first.promise);
    const screen = await mount(client);
    await act(async () => {
      first.reject(AppError({ type: 'server', status: 500 }));
      await first.promise.catch(() => undefined);
    });
    expect(screen.element.textContent).toContain('다시 시도');
    expect(screen.caught).toHaveBeenCalledTimes(1);
    expect(mocks.log).toHaveBeenCalledWith(
      expect.objectContaining({ status: 500 }),
      expect.objectContaining({ scope: 'render', componentStack: expect.any(String) })
    );

    const retry = deferred<unknown>();
    mocks.search.mockReturnValue(retry.promise);
    await act(() => screen.element.querySelector('button')!.click());
    expect(screen.element.querySelector('[role="status"]')).not.toBeNull();
    await act(async () => {
      retry.resolve({ userId: 2, displayName: '친구', relationshipStatus: 'NONE' });
      await retry.promise;
    });
    expect(screen.element.textContent).toContain('친구 요청 보내기');
    expect(screen.element.querySelector('[role="status"]')).toBeNull();
    expect(mocks.log).toHaveBeenCalledTimes(1);
  });

  it('확정 요청의 재조회가 실패하면 요청됨을 유지하면서 재시도와 오류 기록을 제공한다', async () => {
    const client = newClient();
    const options = searchQueryOptions('search@example.com', getAuthQueryScope());
    mocks.search.mockResolvedValue({
      userId: 2,
      displayName: '친구',
      relationshipStatus: 'PENDING_SENT',
      requestId: 10,
    });
    await client.fetchQuery(options);
    mocks.search.mockRejectedValue(AppError({ type: 'server', status: 500 }));
    await client.fetchQuery(options).catch(() => undefined);
    const screen = await mount(client);
    expect(screen.element.textContent).toContain('요청됨');
    expect(screen.element.textContent).toContain('다시 시도');
    expect(screen.caught).not.toHaveBeenCalled();
    expect(mocks.log).toHaveBeenCalledTimes(1);
  });
});
