// @vitest-environment jsdom
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, createElement, Fragment, StrictMode, type ReactNode } from 'react';
import { createRoot } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { AppError } from '../../../api/errors/normalizeError';
import { changeAuthQueryScope, getAuthQueryScope } from '../../../lib/query/authQueryScope';
import { searchQueryOptions } from '../utils/friendsQueryOptions';
import { FriendEmailSearch } from './FriendEmailSearch';

const mocks = vi.hoisted(() => ({ search: vi.fn(), send: vi.fn(), log: vi.fn() }));
vi.mock('../../../api/friendMutator', () => ({
  friendAxios: (config: { method: string }) =>
    config.method === 'POST' ? mocks.send(config) : mocks.search(config),
}));
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

async function mount(client: QueryClient, strict = false) {
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
        strict ? StrictMode : Fragment,
        null,
        createElement(
          QueryClientProvider,
          { client },
          createElement(FriendEmailSearch, {
            email: 'search@example.com',
            onReceived: vi.fn(),
            renderFriend: () => null,
            empty: createElement('span', {}, '일치하는 메일이 없어요.'),
          })
        )
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
    defaultOptions: { queries: { retry: false } },
  });

describe('이메일 검색 실패의 정상 화면 복구', () => {
  it.each([
    ['검색 없음', false],
    ['서버 오류', false],
    ['검색 없음', true],
  ] as const)(
    '초기 %s 뒤 같은 이메일에 다시 진입하면 새 결과로 복구한다 (StrictMode: %s)',
    async (outcome, strict) => {
      const client = newClient();
      const missing =
        outcome === '검색 없음'
          ? AppError({ type: 'notFound', status: 404, code: 'NOT_FOUND' })
          : AppError({ type: 'server', status: 500 });
      const first = deferred<unknown>();
      mocks.search.mockReturnValue(first.promise);
      const options = searchQueryOptions('search@example.com', getAuthQueryScope());
      const screen = await mount(client, strict);
      expect(screen.element.querySelector('[role="status"]')).not.toBeNull();
      await act(async () => {
        first.reject(missing);
        await first.promise.catch(() => undefined);
      });
      await vi.waitFor(async () => {
        await act(async () => {});
        expect(screen.element.textContent).toContain(
          outcome === '검색 없음' ? '일치하는 메일이 없어요.' : '다시 시도'
        );
      });
      expect(screen.caught).toHaveBeenCalled();
      expect(mocks.log).toHaveBeenCalledTimes(outcome === '검색 없음' ? 0 : 1);
      expect(client.getQueryState(options.queryKey)?.error).toBe(missing);

      // 실패 캐시가 남아 있어도 검색에 다시 진입하면 새 조회를 기다린다.
      await act(() => screen.unmount());
      const second = deferred<unknown>();
      mocks.search.mockReturnValue(second.promise);
      const reentered = await mount(client, strict);
      expect(reentered.element.querySelector('[role="status"]')).not.toBeNull();
      await act(async () => {
        second.resolve({ userId: 2, displayName: '새 친구', relationshipStatus: 'NONE' });
        await second.promise;
      });
      await vi.waitFor(async () => {
        await act(async () => {});
        expect(reentered.element.textContent).toContain('친구 요청 보내기');
      });
      expect(reentered.element.querySelector('[role="status"]')).toBeNull();
      expect(reentered.caught).not.toHaveBeenCalled();
      expect(mocks.log).toHaveBeenCalledTimes(outcome === '검색 없음' ? 0 : 1);
    }
  );

  it('초기 서버 오류는 화면에서 안내와 기록을 제공하고 재시도하면 실제 조회로 복구한다', async () => {
    const client = newClient();
    const first = deferred<unknown>();
    mocks.search.mockReturnValue(first.promise);
    const screen = await mount(client);
    await act(async () => {
      first.reject(AppError({ type: 'server', status: 500 }));
      await first.promise.catch(() => undefined);
    });
    await vi.waitFor(async () => {
      await act(async () => {});
      expect(screen.element.textContent).toContain('다시 시도');
    });
    expect(screen.caught).toHaveBeenCalled();
    expect(mocks.log).toHaveBeenCalledWith(
      expect.objectContaining({ status: 500 }),
      expect.objectContaining({
        scope: 'render',
        componentStack: expect.any(String),
      })
    );

    const retry = deferred<unknown>();
    mocks.search.mockReturnValue(retry.promise);
    await act(() => screen.element.querySelector('button')!.click());
    await vi.waitFor(async () => {
      await act(async () => {});
      expect(screen.element.querySelector('[role="status"]')).not.toBeNull();
    });
    await act(async () => {
      retry.resolve({ userId: 2, displayName: '친구', relationshipStatus: 'NONE' });
      await retry.promise;
    });
    await vi.waitFor(async () => {
      await act(async () => {});
      expect(screen.element.textContent).toContain('친구 요청 보내기');
    });
    expect(screen.element.querySelector('[role="status"]')).toBeNull();
    expect(mocks.log).toHaveBeenCalledTimes(1);
  });

  it.each([false, true])(
    '검색 대기 중 나간 뒤 이전 조회가 실패해도 다음 조회를 막지 않는다 (StrictMode: %s)',
    async (strict) => {
      const client = newClient();
      const previous = deferred<unknown>();
      mocks.search.mockReturnValue(previous.promise);
      const screen = await mount(client, strict);
      await act(() => screen.unmount());
      await act(async () => {
        previous.reject(AppError({ type: 'server', status: 500 }));
        await previous.promise.catch(() => undefined);
      });
      mocks.search.mockResolvedValue({
        userId: 2,
        displayName: '친구',
        relationshipStatus: 'NONE',
      });
      const reentered = await mount(client, strict);
      await vi.waitFor(async () => {
        await act(async () => {});
        expect(reentered.element.textContent).toContain('친구 요청 보내기');
      });
      expect(reentered.caught).not.toHaveBeenCalled();
      expect(mocks.log).not.toHaveBeenCalled();
    }
  );

  it('검색 카드 렌더 오류는 예상 검색 없음 정책으로 누락하지 않고 경계에서 기록한다', async () => {
    const client = newClient();
    mocks.search.mockResolvedValue({ userId: 2, relationshipStatus: 'INVALID' });
    const screen = await mount(client);
    await vi.waitFor(async () => {
      await act(async () => {});
      expect(screen.element.textContent).toContain('다시 시도');
    });
    expect(screen.caught).toHaveBeenCalled();
    expect(mocks.log).toHaveBeenCalledTimes(1);
    expect(mocks.log).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        scope: 'render',
        componentStack: expect.any(String),
      })
    );
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
    const screen = await mount(client);
    mocks.search.mockRejectedValue(AppError({ type: 'server', status: 500 }));
    await act(async () => {
      await client.fetchQuery(options).catch(() => undefined);
    });
    expect(screen.element.textContent).toContain('요청됨');
    await vi.waitFor(async () => {
      await act(async () => {});
      expect(screen.element.textContent).toContain('다시 시도');
    });
    expect(screen.caught).not.toHaveBeenCalled();
    expect(mocks.log).toHaveBeenCalledTimes(1);

    const retry = deferred<unknown>();
    mocks.search.mockReturnValue(retry.promise);
    await act(() =>
      Array.from(screen.element.querySelectorAll('button'))
        .find((button) => button.textContent === '다시 시도')!
        .click()
    );
    expect(screen.element.textContent).toContain('요청됨');
    await act(async () => {
      retry.resolve({ userId: 2, displayName: '복구된 친구', relationshipStatus: 'PENDING_SENT' });
      await retry.promise;
    });
    await vi.waitFor(async () => {
      await act(async () => {});
      expect(screen.element.textContent).toContain('복구된 친구');
      expect(screen.element.textContent).not.toContain('다시 시도');
    });
    expect(screen.element.textContent).toContain('요청됨');
    expect(mocks.log).toHaveBeenCalledTimes(1);
  });

  it('전송 중 재조회가 먼저 실패해도 전송 성공은 재시도 없이 요청됨 카드로 복구한다', async () => {
    const client = newClient();
    const options = searchQueryOptions('search@example.com', getAuthQueryScope());
    const user = { userId: 2, displayName: '친구', relationshipStatus: 'NONE' as const };
    client.setQueryData(options.queryKey, user);
    const reading = deferred<unknown>();
    const sending = deferred<unknown>();
    mocks.search.mockReturnValue(reading.promise);
    mocks.send.mockReturnValue(sending.promise);
    const screen = await mount(client);
    let refetching!: Promise<void>;
    await act(() => {
      refetching = client.refetchQueries({ queryKey: options.queryKey, exact: true });
      screen.element.querySelector('button')!.click();
    });
    expect(mocks.send).toHaveBeenCalledTimes(1);
    await act(async () => {
      reading.reject(AppError({ type: 'server', status: 500 }));
      await refetching;
    });
    await vi.waitFor(async () => {
      await act(async () => {});
      expect(screen.element.textContent).toContain('다시 시도');
    });
    expect(screen.caught).not.toHaveBeenCalled();
    expect(mocks.log).toHaveBeenCalledTimes(1);
    expect(mocks.log).toHaveBeenCalledWith(expect.objectContaining({ status: 500 }), {
      scope: 'api',
      operation: 'searchFriendByEmail',
    });
    await act(async () => {
      sending.resolve({ requestId: 10, user: { ...user, relationshipStatus: 'PENDING_SENT' } });
      await sending.promise;
    });
    await vi.waitFor(async () => {
      await act(async () => {});
      expect(screen.element.textContent).toContain('요청됨');
      expect(screen.element.textContent).not.toContain('다시 시도');
    });
    expect(screen.caught).not.toHaveBeenCalled();
    expect(mocks.log).toHaveBeenCalledTimes(1);
    expect(mocks.send).toHaveBeenCalledTimes(1);
  });
});
