// @vitest-environment jsdom
import {
  MutationCache,
  QueryClient,
  QueryClientProvider,
  useSuspenseQuery,
} from '@tanstack/react-query';
import { act, createElement, Suspense } from 'react';
import { createRoot } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type {
  FriendReceivedRequestResponse,
  FriendResponse,
} from '../../../api/query-generated/model';
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
  track: vi.fn(),
}));
vi.mock('../../../lib/analytics', () => ({ trackEvent: api.track }));
vi.mock('../../../api/errors/logger', () => ({ logError: vi.fn() }));
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

async function setup(onMutate?: () => Promise<void>) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
    mutationCache: new MutationCache({ onMutate }),
  });
  let current!: ReturnType<typeof useFriendsListController>;
  let rows: FriendResponse[] = [];
  let requests: FriendReceivedRequestResponse[] = [];
  function FriendsData() {
    rows = useSuspenseQuery(getGetFriendsSuspenseQueryOptions()).data;
    return null;
  }
  function RequestsData() {
    requests = useSuspenseQuery(getGetReceivedRequestsSuspenseQueryOptions()).data;
    return null;
  }
  function Content() {
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
  let mountKey = 0;
  const show = async () => {
    mountKey += 1;
    await act(() => {
      root.render(
        createElement(QueryClientProvider, { client }, createElement(Content, { key: mountKey }))
      );
    });
  };
  await show();
  return {
    client,
    show,
    get state() {
      return current;
    },
    get rows() {
      return rows;
    },
    get requests() {
      return requests;
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
  it('캐시 없는 첫 진입에서는 어느 응답도 완료되기 전에 친구와 받은 요청 조회를 모두 시작한다', async () => {
    const friendsRead = deferred<FriendResponse[]>();
    const requestsRead = deferred<FriendReceivedRequestResponse[]>();
    api.friends.mockReturnValue(friendsRead.promise);
    api.received.mockReturnValue(requestsRead.promise);
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });

    function InitialQueries() {
      // 같은 자식에서 순차로 suspend해도 상위 controller가 두 요청을 먼저 시작해야 한다.
      useSuspenseQuery(getGetFriendsSuspenseQueryOptions());
      useSuspenseQuery(getGetReceivedRequestsSuspenseQueryOptions());
      return null;
    }
    function InitialMount() {
      useFriendsListController();
      return createElement(Suspense, { fallback: null }, createElement(InitialQueries));
    }
    const root = createRoot(document.createElement('div'));
    cleanups.push(() => {
      root.unmount();
      client.clear();
    });

    try {
      await act(() => {
        root.render(createElement(QueryClientProvider, { client }, createElement(InitialMount)));
      });
      expect(api.friends).toHaveBeenCalled();
      expect(api.received).toHaveBeenCalled();
    } finally {
      await act(async () => {
        friendsRead.resolve([friend]);
        requestsRead.resolve([request]);
        await Promise.all([friendsRead.promise, requestsRead.promise]);
      });
    }
  });

  it('화면이 유지된 채 조회 캐시가 정리되고 다시 생성돼도 다음 변경은 새 조회 결과에 적용한다', async () => {
    const screen = await setup();
    const friendsOptions = getGetFriendsSuspenseQueryOptions();
    const requestsOptions = getGetReceivedRequestsSuspenseQueryOptions();
    await act(async () => {
      screen.client.removeQueries({ queryKey: requestsOptions.queryKey, exact: true });
      await screen.client.fetchQuery(requestsOptions);
    });
    const accepted = { friendshipId: 42, user: request.user };
    api.accept.mockImplementationOnce(async () => {
      api.friends.mockResolvedValue([friend, accepted]);
      api.received.mockResolvedValue([]);
      return accepted;
    });
    await act(async () => {
      expect(await screen.state.acceptRequest(72)).toBe(true);
    });
    expect(api.accept).toHaveBeenCalledTimes(1);
    expect(screen.client.getQueryData(friendsOptions.queryKey)).toContainEqual(accepted);
    expect(api.track.mock.calls).toEqual([['Friend Request Accepted']]);
  });

  it('변경 시작 뒤 인증 정리 중 캐시가 삭제되면 새 목록을 조회해도 이전 수락은 전송하지 않는다', async () => {
    const entered = deferred<void>();
    const resume = deferred<void>();
    const screen = await setup(() => {
      entered.resolve();
      return resume.promise;
    });
    let writing!: Promise<boolean>;
    await act(async () => {
      writing = screen.state.acceptRequest(72);
      await entered.promise;
    });
    await act(() => screen.client.clear());
    await screen.show();
    await act(async () => {
      resume.resolve();
      expect(await writing).toBe(false);
    });
    expect(api.accept).not.toHaveBeenCalled();
    expect(screen.rows).toEqual([friend]);
    expect(screen.requests).toEqual([request]);
    expect(screen.state.error).toBeNull();
    expect(api.track).not.toHaveBeenCalled();
  });

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
    expect(api.track).not.toHaveBeenCalled();
    expect(await remove(screen)).toBe(true);
    expect(screen.rows).toEqual([]);
    expect(api.track.mock.calls).toEqual([['Friend Removed']]);
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

  it('확정된 삭제는 받은 요청 재조회를 기다리지 않고 완료되며 이후 재조회 실패도 삭제를 되돌리지 않는다', async () => {
    const screen = await setup();
    const reconciliation = deferred<(typeof request)[]>();
    api.received.mockReturnValueOnce(reconciliation.promise);

    expect(await remove(screen)).toBe(true);
    expect(screen.state.pendingActionId).toBeNull();
    expect(screen.rows).toEqual([]);
    expect(screen.state.refreshing).toBe(true);

    await act(async () => {
      reconciliation.reject(new Error('offline'));
      await reconciliation.promise.catch(() => undefined);
    });
    expect(screen.rows).toEqual([]);
    expect(screen.state.pendingActionId).toBeNull();
    expect(screen.state.error).toBeNull();
    expect(api.track.mock.calls).toEqual([['Friend Removed']]);
  });

  it.each(['성공', '실패'] as const)(
    '로그아웃 후 새 목록을 조회하는 동안 이전 요청 수락이 %s해도 새 목록과 조회를 보존하고 다음 액션을 허용한다',
    async (outcome) => {
      const screen = await setup();
      const oldWrite = deferred<FriendResponse>();
      api.accept.mockReturnValueOnce(oldWrite.promise);
      let writing!: Promise<boolean>;
      await act(() => {
        writing = screen.state.acceptRequest(72);
      });

      const nextFriend = { friendshipId: 99, user: { userId: 10, displayName: '새 계정 친구' } };
      const nextRequest = { requestId: 72, user: { userId: 11, displayName: '새 계정 요청' } };
      api.friends.mockResolvedValue([nextFriend]);
      api.received.mockResolvedValue([nextRequest]);
      await act(() => {
        screen.client.clear();
        screen.client.setQueryData(getGetFriendsSuspenseQueryOptions().queryKey, [nextFriend]);
        screen.client.setQueryData(getGetReceivedRequestsSuspenseQueryOptions().queryKey, [
          nextRequest,
        ]);
      });
      await screen.show();
      const friendsOptions = getGetFriendsSuspenseQueryOptions();

      const nextRead = deferred<FriendResponse[]>();
      const nextReadStarted = deferred<void>();
      api.friends.mockImplementationOnce(() => {
        nextReadStarted.resolve();
        return nextRead.promise;
      });
      let reading!: Promise<FriendResponse[]>;
      await act(async () => {
        reading = screen.client.fetchQuery(friendsOptions);
        await nextReadStarted.promise;
      });
      await act(async () => {
        if (outcome === '성공') oldWrite.resolve({ friendshipId: 42, user: request.user });
        else oldWrite.reject(new Error('offline'));
        expect(await writing).toBe(false);
      });
      expect(screen.rows).toEqual([nextFriend]);
      expect(screen.requests).toEqual([nextRequest]);
      expect(screen.state.pendingActionId).toBeNull();
      expect(screen.state.error).toBeNull();
      expect(api.track).not.toHaveBeenCalled();

      const refreshedFriend = {
        ...nextFriend,
        user: { ...nextFriend.user, displayName: '갱신된 친구' },
      };
      await act(async () => {
        nextRead.resolve([refreshedFriend]);
        expect(await reading).toEqual([refreshedFriend]);
      });
      await vi.waitFor(async () => {
        await act(async () => {});
        expect(screen.rows).toEqual([refreshedFriend]);
      });
      await act(async () => {
        expect(await screen.state.rejectRequest(72)).toBe(true);
      });
      expect(screen.requests).toEqual([]);
      expect(api.track.mock.calls).toEqual([['Friend Request Rejected']]);
    }
  );
});
