// @vitest-environment jsdom
import { QueryClient, QueryClientProvider, useSuspenseQuery } from '@tanstack/react-query';
import { CanceledError } from 'axios';
import { act, createElement, Suspense } from 'react';
import { createRoot } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { getSearchByEmailSuspenseQueryOptions } from '../../../api/query-generated/friend';
import type {
  FriendRequestResponse,
  FriendSearchResponse,
} from '../../../api/query-generated/model';
import {
  changeAuthQueryScope,
  getAuthQueryScope,
  type AuthQueryScope,
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

async function setup() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const root = createRoot(document.createElement('div'));
  let current!: ReturnType<typeof useSendFriendRequest>;
  let result!: FriendSearchResponse;
  function Content({ email, scope }: { email: string; scope: AuthQueryScope }) {
    result = useSuspenseQuery(
      getSearchByEmailSuspenseQueryOptions(
        { email },
        { query: { queryKey: searchQueryOptions(email, scope).queryKey } }
      )
    ).data;
    current = useSendFriendRequest(email, result, scope);
    return null;
  }
  const show = async (email: string) => {
    const scope = getAuthQueryScope();
    await act(() =>
      root.render(
        createElement(
          QueryClientProvider,
          { client },
          createElement(
            Suspense,
            { fallback: null },
            createElement(Content, { key: `${email}:${scope.version}`, email, scope })
          )
        )
      )
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

describe('친구 요청 전송의 경합과 복구', () => {
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
      expect(screen.state.pending).toBe(false);
      if (outcome === '취소') {
        expect(screen.state.error).toBeNull();
        expect(api.log).not.toHaveBeenCalled();
      } else expect(screen.state.error).not.toBeNull();
      expect(api.track).not.toHaveBeenCalled();
      await act(() => screen.state.send());
      expect(screen.user.relationshipStatus).toBe('PENDING_SENT');
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
      changeAuthQueryScope('1');
      screen.client.clear();
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

  it('확정 전송 후 재조회 실패도 요청됨 상태와 공통 친구 정보를 되돌리지 않는다', async () => {
    const screen = await setup();
    await act(() => screen.state.send());
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
});
