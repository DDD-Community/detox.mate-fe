// @vitest-environment jsdom
import {
  MutationCache,
  QueryClient,
  QueryClientProvider,
  useSuspenseQuery,
} from '@tanstack/react-query';
import { CanceledError } from 'axios';
import { act, createElement, Suspense } from 'react';
import { createRoot } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type {
  FriendRequestResponse,
  FriendSearchResponse,
} from '../../../api/query-generated/model';
import {
  changeAuthQueryScope,
  getAuthQueryScope,
  useAuthQueryScope,
} from '../../../lib/query/authQueryScope';
import { searchQueryOptions } from '../utils/friendsQueryOptions';
import { useSendFriendRequest } from './useSendFriendRequest';

const api = vi.hoisted(() => ({ search: vi.fn(), send: vi.fn(), track: vi.fn(), log: vi.fn() }));
vi.mock('../../../lib/analytics', () => ({ trackEvent: api.track }));
vi.mock('../../../api/friendMutator', () => ({
  friendAxios: ({
    method,
    params,
    data,
  }: {
    method: string;
    params?: { email: string };
    data?: { targetUserId: number };
  }) => (method === 'GET' ? api.search(params?.email) : api.send(data?.targetUserId)),
}));
vi.mock('../../../api/errors/logger', () => ({ logError: api.log }));
Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
const cleanups: (() => void)[] = [];
const alice: FriendSearchResponse = {
  userId: 2,
  displayName: '친구 A',
  relationshipStatus: 'NONE',
  mutualFriendCount: 3,
  mutualFriendPreviewName: '서연',
};
const bob: FriendSearchResponse = { userId: 3, displayName: '친구 B', relationshipStatus: 'NONE' };
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
  changeAuthQueryScope('1');
  api.search.mockImplementation(async (email: string) => (email.startsWith('a@') ? alice : bob));
  api.send.mockResolvedValue({
    requestId: 10,
    user: { ...alice, relationshipStatus: 'PENDING_SENT' },
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
  const root = createRoot(document.createElement('div'));
  let current!: ReturnType<typeof useSendFriendRequest>;
  let result!: FriendSearchResponse;
  function Content({ email }: { email: string }) {
    const scope = useAuthQueryScope();
    result = useSuspenseQuery(searchQueryOptions(email, scope)).data;
    current = useSendFriendRequest(email, result);
    return null;
  }
  function Harness({ email }: { email: string }) {
    const scope = useAuthQueryScope();
    return createElement(
      Suspense,
      { fallback: null },
      createElement(Content, { key: `${email}:${scope.version}`, email })
    );
  }
  const show = async (email: string) => {
    await act(() =>
      root.render(createElement(QueryClientProvider, { client }, createElement(Harness, { email })))
    );
  };
  cleanups.push(() => {
    root.unmount();
    client.clear();
  });
  await show('a@example.com');
  return {
    client,
    show,
    get state() {
      return current;
    },
    get user() {
      return result;
    },
  };
}

async function waitForResult(assertion: () => void) {
  // Query의 구독 알림 뒤 공개 결과가 갱신될 때까지 기다린다.
  await vi.waitFor(async () => {
    await act(async () => {});
    assertion();
  });
}

describe('친구 요청 전송의 경합과 복구', () => {
  it('전송 실행 직전 세션이 바뀌면 이전 액션은 새 계정으로 쓰지 않고 새 결과와 안내를 보존한다', async () => {
    const entered = deferred<void>();
    const resume = deferred<void>();
    const screen = await setup(() => {
      entered.resolve();
      return resume.promise;
    });
    let sending!: Promise<void>;
    await act(async () => {
      sending = screen.state.send();
      await entered.promise;
    });
    await act(() => {
      changeAuthQueryScope('2');
      screen.client.clear();
    });
    await screen.show('a@example.com');
    await act(async () => {
      resume.resolve();
      await sending;
    });
    expect(api.send).not.toHaveBeenCalled();
    expect(screen.user.relationshipStatus).toBe('NONE');
    expect(screen.state.pending).toBe(false);
    expect(screen.state.error).toBeNull();
    expect(api.track).not.toHaveBeenCalled();
    expect(api.log).not.toHaveBeenCalled();
  });

  it.each(['실패', '취소'] as const)(
    '연속 전송은 한 번만 쓰고 %s한 요청은 성공 기록 없이 다시 보낼 수 있다',
    async (outcome) => {
      const screen = await setup();
      const pending = deferred<FriendRequestResponse>();
      api.send.mockReturnValueOnce(pending.promise);
      let sending!: Promise<void>;
      await act(() => {
        sending = screen.state.send();
        void screen.state.send();
      });
      expect(api.send).toHaveBeenCalledTimes(1);
      await act(async () => {
        pending.reject(outcome === '취소' ? new CanceledError() : new Error('offline'));
        await sending;
      });
      await waitForResult(() => expect(screen.state.pending).toBe(false));
      if (outcome === '취소') {
        expect(screen.state.error).toBeNull();
        expect(api.log).not.toHaveBeenCalled();
      } else {
        expect(screen.state.error).not.toBeNull();
        const queryKey = searchQueryOptions('a@example.com', getAuthQueryScope()).queryKey;
        await act(() => {
          screen.client.setQueryData(queryKey, {
            ...alice,
            relationshipStatus: 'PENDING_RECEIVED',
          });
        });
        await waitForResult(() => {
          expect(screen.user.relationshipStatus).toBe('PENDING_RECEIVED');
          expect(screen.state.error).toBeNull();
        });
        await act(() => screen.client.setQueryData(queryKey, alice));
        await waitForResult(() => {
          expect(screen.user.relationshipStatus).toBe('NONE');
          expect(screen.state.error).toBeNull();
        });
      }
      expect(api.track).not.toHaveBeenCalled();
      await act(() => screen.state.send());
      await waitForResult(() => expect(screen.user.relationshipStatus).toBe('PENDING_SENT'));
      expect(api.track.mock.calls).toEqual([['Friend Request Sent']]);
    }
  );

  it('표시 직후 받은 요청 상태로 바뀌면 이전 보내기 액션도 재요청하지 않는다', async () => {
    const screen = await setup();
    const previousSend = screen.state.send;
    await act(async () => {
      screen.client.setQueryData(
        searchQueryOptions('a@example.com', getAuthQueryScope()).queryKey,
        { ...alice, relationshipStatus: 'PENDING_RECEIVED', requestId: 18 }
      );
      await previousSend();
    });
    expect(api.send).not.toHaveBeenCalled();
  });

  it('A 전송 중 B를 검색하면 A 완료는 B 카드나 요청 대상에 반영되지 않는다', async () => {
    const screen = await setup();
    const pending = deferred<FriendRequestResponse>();
    api.send.mockReturnValueOnce(pending.promise);
    let sending!: Promise<void>;
    await act(() => {
      sending = screen.state.send();
    });
    await screen.show('b@example.com');
    await act(async () => {
      pending.resolve({ requestId: 10, user: { ...alice, relationshipStatus: 'PENDING_SENT' } });
      await sending;
    });
    expect(screen.user).toEqual(bob);
    await act(() => screen.state.send());
    expect(api.send.mock.calls.map(([id]) => id)).toEqual([2, 3]);
  });

  it('전송 중 A에서 B를 거쳐 A로 돌아와도 같은 대상에 다시 쓰지 않는다', async () => {
    const screen = await setup();
    const previousSend = screen.state.send;
    const pending = deferred<FriendRequestResponse>();
    api.send.mockReturnValueOnce(pending.promise);
    let sending!: Promise<void>;
    await act(() => {
      sending = screen.state.send();
    });
    await screen.show('b@example.com');
    await screen.show('a@example.com');
    expect(screen.state.pending).toBe(true);
    await act(async () => {
      await previousSend();
      await screen.state.send();
    });
    expect(api.send).toHaveBeenCalledTimes(1);
    await act(async () => {
      pending.resolve({ requestId: 10, user: alice });
      await sending;
    });
    await waitForResult(() => {
      expect(screen.user.relationshipStatus).toBe('PENDING_SENT');
      expect(screen.state.pending).toBe(false);
    });
    expect(api.track.mock.calls).toEqual([['Friend Request Sent']]);
  });

  it('API 성공 후 캐시 반영이 끝날 때까지 대기를 유지하고 추가 전송을 막는다', async () => {
    const screen = await setup();
    const entered = deferred<void>();
    const resume = deferred<void>();
    const cancel = screen.client.cancelQueries.bind(screen.client);
    vi.spyOn(screen.client, 'cancelQueries').mockImplementationOnce(async (...args) => {
      entered.resolve();
      await resume.promise;
      await cancel(...args);
    });
    let sending!: Promise<void>;
    await act(async () => {
      sending = screen.state.send();
      await entered.promise;
    });
    await waitForResult(() => expect(screen.state.pending).toBe(true));
    await act(() => screen.state.send());
    expect(api.send).toHaveBeenCalledTimes(1);
    await act(async () => {
      resume.resolve();
      await sending;
    });
    await waitForResult(() => {
      expect(screen.user.relationshipStatus).toBe('PENDING_SENT');
      expect(screen.state.pending).toBe(false);
    });
    expect(api.track.mock.calls).toEqual([['Friend Request Sent']]);
  });

  it.each(['성공', '실패'] as const)(
    '동일 사용자 재로그인 뒤 이전 요청이 %s해도 새 세션의 결과와 안내를 보존한다',
    async (outcome) => {
      const screen = await setup();
      const pending = deferred<FriendRequestResponse>();
      api.send.mockReturnValueOnce(pending.promise);
      let sending!: Promise<void>;
      await act(() => {
        sending = screen.state.send();
      });
      await act(() => {
        changeAuthQueryScope('1');
        screen.client.clear();
      });
      await screen.show('a@example.com');
      await act(async () => {
        if (outcome === '성공') pending.resolve({ requestId: 10, user: alice });
        else pending.reject(new Error('offline'));
        await sending;
      });
      expect(screen.user.relationshipStatus).toBe('NONE');
      expect(screen.state.error).toBeNull();
      expect(screen.state.pending).toBe(false);
      expect(api.track).not.toHaveBeenCalled();
    }
  );

  it('확정 전송 후 분석 기록과 재조회 실패도 요청됨 상태와 공통 친구 정보를 되돌리지 않는다', async () => {
    const screen = await setup();
    api.track.mockImplementationOnce(() => {
      throw new Error('analytics unavailable');
    });
    await act(() => screen.state.send());
    await waitForResult(() => expect(screen.user.relationshipStatus).toBe('PENDING_SENT'));
    api.search.mockRejectedValue(new Error('offline'));
    await act(() =>
      screen.client.refetchQueries({
        queryKey: searchQueryOptions('a@example.com', getAuthQueryScope()).queryKey,
      })
    );
    expect(screen.user.relationshipStatus).toBe('PENDING_SENT');
    expect(screen.user.mutualFriendCount).toBe(3);
    expect(screen.state.error).toBeNull();
    expect(screen.state.pending).toBe(false);
    expect(api.track.mock.calls).toEqual([['Friend Request Sent']]);
  });

  it('전송 전에 시작된 조회가 늦게 완료돼도 확정된 요청됨을 되돌리지 않는다', async () => {
    const screen = await setup();
    const staleRead = deferred<FriendSearchResponse>();
    api.search.mockReturnValueOnce(staleRead.promise);
    let reading!: Promise<void>;
    await act(() => {
      reading = screen.client.refetchQueries({
        queryKey: searchQueryOptions('a@example.com', getAuthQueryScope()).queryKey,
        exact: true,
      });
    });
    await act(() => screen.state.send());
    await waitForResult(() => expect(screen.user.relationshipStatus).toBe('PENDING_SENT'));
    await act(async () => {
      staleRead.resolve(alice);
      await staleRead.promise;
      await reading;
    });
    expect(screen.user.relationshipStatus).toBe('PENDING_SENT');
    expect(screen.state.pending).toBe(false);
    await act(() => screen.state.send());
    expect(api.send).toHaveBeenCalledTimes(1);
    expect(api.track.mock.calls).toEqual([['Friend Request Sent']]);
  });
});
