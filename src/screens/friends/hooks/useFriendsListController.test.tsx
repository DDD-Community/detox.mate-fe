// @vitest-environment jsdom
import { QueryClient, QueryClientProvider, useSuspenseQuery } from '@tanstack/react-query';
import { act, createElement, Suspense } from 'react';
import { createRoot } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { FriendResponse } from '../../../api/query-generated/model';
import {
  beginAuthTransition,
  completeAuthTransition,
  useAuthSessionStore,
  type AuthScope,
} from '../../../stores/authSessionStore';
import { friendsQueryOptions, receivedRequestsQueryOptions } from './friendsQueries';
import { useFriendsListController } from './useFriendsListController';

const api = vi.hoisted(() => ({
  friends: vi.fn(),
  received: vi.fn(),
  accept: vi.fn(),
  reject: vi.fn(),
  remove: vi.fn(),
}));
vi.mock('expo-secure-store', () => ({ getItemAsync: vi.fn() }));
vi.mock('../../../api/friendMutator', () => ({
  friendAxios: ({ url, method }: { url: string; method: string }) => {
    if (url === '/friends') return api.friends();
    if (url === '/friends/requests/received') return api.received();
    if (url.endsWith('/accept')) return api.accept();
    return method === 'DELETE' && url.startsWith('/friends/requests/')
      ? api.reject()
      : api.remove();
  },
}));
Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
const friend: FriendResponse = { friendshipId: 41, user: { userId: 8, displayName: '홍길동' } };
const request = { requestId: 72, user: { userId: 9, displayName: '친구' } };
const cleanups: (() => void)[] = [];

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

function login(userId: number): AuthScope {
  completeAuthTransition(beginAuthTransition(), userId);
  return useAuthSessionStore.getState().scope!;
}

beforeEach(() => {
  vi.resetAllMocks();
  api.friends.mockResolvedValue([friend]);
  api.received.mockResolvedValue([request]);
  api.accept.mockResolvedValue({ friendshipId: 42, user: request.user });
  api.reject.mockImplementation(async () => {
    api.received.mockResolvedValue([]);
  });
  api.remove.mockImplementation(async () => {
    api.friends.mockResolvedValue([]);
  });
});
afterEach(async () => {
  await act(() => cleanups.splice(0).forEach((cleanup) => cleanup()));
});

async function setup(scope = login(1)) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  let current!: ReturnType<typeof useFriendsListController>;
  let rows: FriendResponse[] = [];
  function FriendsData({ scope }: { scope: AuthScope }) {
    rows = useSuspenseQuery(friendsQueryOptions(scope)).data;
    return null;
  }
  function RequestsData({ scope }: { scope: AuthScope }) {
    useSuspenseQuery(receivedRequestsQueryOptions(scope));
    return null;
  }
  function Harness({ scope }: { scope: AuthScope }) {
    current = useFriendsListController(scope);
    return createElement(
      Suspense,
      { fallback: null },
      createElement(FriendsData, { scope }),
      createElement(RequestsData, { scope })
    );
  }
  const root = createRoot(document.createElement('div'));
  const render = async (nextScope: AuthScope) => {
    await act(() =>
      root.render(
        createElement(
          QueryClientProvider,
          { client },
          createElement(Harness, { scope: nextScope, key: nextScope.sessionId })
        )
      )
    );
  };
  cleanups.push(() => {
    root.unmount();
    client.clear();
  });
  await render(scope);
  return {
    client,
    render,
    get state() {
      return current;
    },
    get rows() {
      return rows;
    },
  };
}

async function remove(screen: Awaited<ReturnType<typeof setup>>) {
  let result!: boolean;
  await act(async () => {
    result = await screen.state.deleteFriend(41);
  });
  return result;
}

describe('friends query actions', () => {
  it('blocks duplicate writes synchronously and remains retryable after a write failure', async () => {
    const pending = deferred<void>();
    const screen = await setup();
    api.remove.mockReturnValueOnce(pending.promise);
    let first!: Promise<boolean>;
    await act(async () => {
      first = screen.state.deleteFriend(41);
      expect(await screen.state.deleteFriend(41)).toBe(false);
    });
    expect(api.remove).toHaveBeenCalledTimes(1);
    await act(async () => {
      pending.reject(new Error('offline'));
      expect(await first).toBe(false);
    });
    expect(screen.rows).toEqual([friend]);
    expect(await remove(screen)).toBe(true);
    expect(screen.rows).toEqual([]);
  });

  it('retains a confirmed deletion when reconciliation fails and when an older read arrives', async () => {
    const screen = await setup();
    const oldRead = deferred<FriendResponse[]>();
    api.friends.mockReturnValueOnce(oldRead.promise);
    let reading!: Promise<void>;
    await act(() => {
      reading = screen.state.refresh();
    });
    api.remove.mockImplementationOnce(async () => {
      api.friends.mockRejectedValue(new Error('offline'));
    });
    expect(await remove(screen)).toBe(true);
    await act(async () => {
      oldRead.resolve([friend]);
      await reading;
    });
    expect(screen.rows).toEqual([]);
    expect(screen.state.pendingActionId).toBeNull();
  });

  it('keeps late reads invisible across A to B to C account changes', async () => {
    const screen = await setup();
    const oldA = deferred<FriendResponse[]>();
    const oldB = deferred<FriendResponse[]>();
    api.friends.mockReturnValueOnce(oldA.promise);
    let readingA!: Promise<void>;
    await act(() => {
      readingA = screen.state.refresh();
    });
    const scopeB = login(2);
    api.friends.mockResolvedValue([
      { friendshipId: 88, user: { userId: 11, displayName: 'B 친구' } },
    ]);
    await screen.render(scopeB);
    api.friends.mockReturnValueOnce(oldB.promise);
    let readingB!: Promise<void>;
    await act(() => {
      readingB = screen.state.refresh();
    });
    const scopeC = login(3);
    const currentFriend = { friendshipId: 99, user: { userId: 12, displayName: 'C 친구' } };
    api.friends.mockResolvedValue([currentFriend]);
    await screen.render(scopeC);
    await act(async () => {
      oldB.resolve([friend]);
      oldA.resolve([friend]);
      await Promise.all([readingA, readingB]);
    });
    expect(screen.rows).toEqual([currentFriend]);
    expect(screen.state.error).toBeNull();
  });

  it.each([2, 1])(
    'isolates late reads and writes when the next login is user %s',
    async (nextUserId) => {
      const screen = await setup();
      const oldRead = deferred<FriendResponse[]>();
      const oldWrite = deferred<void>();
      api.friends.mockReturnValueOnce(oldRead.promise);
      let reading!: Promise<void>;
      await act(() => {
        reading = screen.state.refresh();
      });
      api.remove.mockReturnValueOnce(oldWrite.promise);
      let writing!: Promise<boolean>;
      await act(() => {
        writing = screen.state.deleteFriend(41);
      });
      const next = login(nextUserId);
      const newFriend = { friendshipId: 99, user: { userId: 10, displayName: '새 세션 친구' } };
      api.friends.mockResolvedValue([newFriend]);
      await screen.render(next);
      await act(async () => {
        oldWrite.resolve();
        oldRead.resolve([friend]);
        await reading;
        expect(await writing).toBe(false);
      });
      expect(screen.rows).toEqual([newFriend]);
      expect(screen.state.pendingActionId).toBeNull();
    }
  );
});
