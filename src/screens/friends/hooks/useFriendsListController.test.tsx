// @vitest-environment jsdom
import { QueryClient, QueryClientProvider, useSuspenseQuery } from '@tanstack/react-query';
import { act, createElement, Suspense } from 'react';
import { createRoot } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { FriendResponse } from '../../../api/query-generated/model';
import {
  getGetFriendsSuspenseQueryOptions,
  getGetReceivedRequestsSuspenseQueryOptions,
} from '../../../api/query-generated/friend';
import { useFriendsListController } from './useFriendsListController';

const api = vi.hoisted(() => ({
  friends: vi.fn(),
  received: vi.fn(),
  accept: vi.fn(),
  reject: vi.fn(),
  remove: vi.fn(),
}));
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

async function setup() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  let current!: ReturnType<typeof useFriendsListController>;
  let rows: FriendResponse[] = [];
  function FriendsData() {
    rows = useSuspenseQuery(getGetFriendsSuspenseQueryOptions()).data;
    return null;
  }
  function RequestsData() {
    useSuspenseQuery(getGetReceivedRequestsSuspenseQueryOptions());
    return null;
  }
  function Harness() {
    current = useFriendsListController();
    return createElement(
      Suspense,
      { fallback: null },
      createElement(FriendsData),
      createElement(RequestsData)
    );
  }
  const root = createRoot(document.createElement('div'));
  cleanups.push(() => {
    root.unmount();
    client.clear();
  });
  await act(() => {
    root.render(createElement(QueryClientProvider, { client }, createElement(Harness)));
  });
  return {
    client,
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

describe('친구 목록 조회와 변경 액션', () => {
  it('친구 삭제 중에는 중복 변경을 즉시 차단하고 삭제 실패 후에는 재시도를 허용한다', async () => {
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

  it('친구 삭제가 확정되면 후속 재조회가 실패하거나 이전 조회가 늦게 도착해도 삭제 결과를 유지한다', async () => {
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
});
