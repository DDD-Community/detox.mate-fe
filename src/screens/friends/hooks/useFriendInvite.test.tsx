// @vitest-environment jsdom
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, createElement, Suspense } from 'react';
import { createRoot } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { getGetInviteeSuspenseQueryOptions } from '../../../api/query-generated/friend';
import type {
  FriendInviteeResponse,
  FriendRequestResponse,
} from '../../../api/query-generated/model';
import { useFriendInvite } from './useFriendInvite';

const api = vi.hoisted(() => ({ read: vi.fn(), send: vi.fn(), log: vi.fn(), track: vi.fn() }));
vi.mock('../../../api/friendMutator', () => ({
  friendAxios: ({ method }: { method: string }) => (method === 'POST' ? api.send() : api.read()),
}));
vi.mock('../../../api/errors/logger', () => ({ logError: api.log }));
vi.mock('../../../lib/analytics', () => ({ trackEvent: api.track }));
Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });

const invitee: FriendInviteeResponse = {
  userId: 7,
  displayName: '홍길동',
  relationshipStatus: 'NONE',
};
const sent = { ...invitee, relationshipStatus: 'PENDING_SENT' as const, requestId: 32 };
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
  api.read.mockResolvedValue(invitee);
  api.send.mockImplementation(async () => {
    api.read.mockResolvedValue(sent);
    return { requestId: 32 };
  });
});
afterEach(async () => {
  await act(() => cleanups.splice(0).forEach((cleanup) => cleanup()));
});

async function setup() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  let current!: ReturnType<typeof useFriendInvite>;
  function Harness() {
    current = useFriendInvite('testCode');
    return null;
  }
  const root = createRoot(document.createElement('div'));
  cleanups.push(() => {
    root.unmount();
    client.clear();
  });
  await act(() => {
    root.render(
      createElement(
        QueryClientProvider,
        { client },
        createElement(Suspense, { fallback: null }, createElement(Harness))
      )
    );
  });
  return {
    client,
    get state() {
      return current;
    },
  };
}

describe('초대 화면의 친구 요청', () => {
  it('요청 전송 중 연속 액션은 쓰기 한 번만 만들고 실패 후에는 재시도를 허용한다', async () => {
    const screen = await setup();
    const pending = deferred<FriendRequestResponse>();
    api.send.mockReturnValueOnce(pending.promise);
    let writing!: Promise<void>;
    await act(async () => {
      writing = screen.state.sendRequest();
      await screen.state.sendRequest();
    });
    expect(api.send).toHaveBeenCalledTimes(1);
    await act(async () => {
      pending.reject(new Error('offline'));
      await writing;
    });
    expect(screen.state.sending).toBe(false);
    expect(screen.state.sendError).not.toBeNull();
    expect(api.track).not.toHaveBeenCalled();
    await act(async () => {
      await screen.state.sendRequest();
    });
    expect(screen.state.invitee.relationshipStatus).toBe('PENDING_SENT');
    expect(api.track).toHaveBeenCalledExactlyOnceWith('Friend Request Sent', {
      entry_point: 'invite_link',
    });
  });

  it('전송이 확정되면 이전 조회가 늦게 도착하거나 후속 조회가 실패해도 요청됨을 유지한다', async () => {
    const screen = await setup();
    const oldRead = deferred<FriendInviteeResponse>();
    api.read.mockReturnValueOnce(oldRead.promise);
    let reading!: Promise<void>;
    await act(() => {
      reading = screen.state.refresh();
    });
    api.send.mockImplementationOnce(async () => {
      api.read.mockRejectedValue(new Error('offline'));
      return { requestId: 32 };
    });
    await act(async () => {
      await screen.state.sendRequest();
    });
    await act(async () => {
      oldRead.resolve(invitee);
      await reading;
    });
    expect(screen.state.invitee.relationshipStatus).toBe('PENDING_SENT');
    expect(screen.state.sendError).toBeNull();
    expect(screen.state.readError).not.toBeNull();
    await act(async () => {
      await screen.state.sendRequest();
    });
    expect(api.send).toHaveBeenCalledTimes(1);
    expect(api.track).toHaveBeenCalledTimes(1);
  });

  it.each(['성공', '실패'] as const)(
    '계정 변경 후 이전 전송이 %s해도 새 계정 초대 상태를 오염시키지 않는다',
    async (outcome) => {
      const screen = await setup();
      const oldWrite = deferred<FriendRequestResponse>();
      api.send.mockReturnValueOnce(oldWrite.promise);
      let writing!: Promise<void>;
      await act(() => {
        writing = screen.state.sendRequest();
      });
      const nextUser = { ...invitee, userId: 9, displayName: '새 계정 초대' };
      const options = getGetInviteeSuspenseQueryOptions('testCode');
      api.read.mockResolvedValue(nextUser);
      await act(() => {
        screen.client.clear();
        screen.client.setQueryData(options.queryKey, nextUser);
      });
      await act(async () => {
        if (outcome === '성공') oldWrite.resolve({ requestId: 32 });
        else oldWrite.reject(new Error('offline'));
        await writing;
      });
      expect(screen.state.invitee).toEqual(nextUser);
      expect(screen.state.sendError).toBeNull();
      expect(screen.state.sending).toBe(false);
      expect(api.track).not.toHaveBeenCalled();
    }
  );
});
