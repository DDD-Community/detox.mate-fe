// @vitest-environment jsdom
import { act, createElement, StrictMode, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { afterEach, describe, expect, it, vi } from 'vitest';

import type { FriendResponse } from '../../../api/generated/model';
import type { FriendsListApi } from '../utils/friendsListData';
import { useFriendsList } from './useFriendsList';

Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
const friend: FriendResponse = { friendshipId: 41, user: { userId: 8, displayName: '홍길동' } };
const request = { requestId: 72, user: { userId: 9, displayName: '친구' } };
const cleanups: (() => void)[] = [];
afterEach(async () => {
  await act(() => {
    cleanups.splice(0).forEach((cleanup) => cleanup());
  });
});

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((res) => {
    resolve = res;
  });
  return { promise, resolve };
}

async function setup(overrides: Partial<FriendsListApi> = {}, strict = false) {
  const api = {
    getFriends: vi.fn<FriendsListApi['getFriends']>(overrides.getFriends ?? (async () => [friend])),
    getReceivedRequests: vi.fn<FriendsListApi['getReceivedRequests']>(
      overrides.getReceivedRequests ?? (async () => [request])
    ),
    acceptRequest: vi.fn<FriendsListApi['acceptRequest']>(
      overrides.acceptRequest ?? (async () => ({ friendshipId: 42, user: request.user }))
    ),
    deletePendingRequest: vi.fn<FriendsListApi['deletePendingRequest']>(
      overrides.deletePendingRequest ?? (async () => {})
    ),
    unfriend: vi.fn<FriendsListApi['unfriend']>(overrides.unfriend ?? (async () => {})),
  };
  let current!: ReturnType<typeof useFriendsList>;
  function Harness({ focused }: { focused: boolean }) {
    const controller = useFriendsList(api);
    current = controller;
    const { onFocus } = controller;
    useEffect(() => (focused ? onFocus() : undefined), [focused, onFocus]);
    return null;
  }
  const root = createRoot(document.createElement('div'));
  let mounted = true;
  const unmount = () => {
    if (mounted) {
      root.unmount();
      mounted = false;
    }
  };
  cleanups.push(unmount);
  const focus = async (focused: boolean) => {
    await act(() =>
      root.render(
        strict
          ? createElement(StrictMode, null, createElement(Harness, { focused }))
          : createElement(Harness, { focused })
      )
    );
  };
  await focus(true);
  return {
    api,
    get state() {
      return current;
    },
    focus,
    unmount,
  };
}

async function change(
  screen: Awaited<ReturnType<typeof setup>>,
  action: Parameters<typeof screen.state.changeFriendship>[0]
) {
  let result!: boolean;
  await act(async () => {
    result = await screen.state.changeFriendship(action);
  });
  return result;
}

describe('screen-local friends list', () => {
  it('loads on focus and exposes an initial failure without endless loading', async () => {
    const screen = await setup();
    expect(screen.state.friends).toHaveLength(1);
    expect(screen.state.receivedRequests).toEqual([request]);
    expect(screen.state.loading).toBe(false);
    const failed = await setup({
      getFriends: async () => {
        throw new Error('offline');
      },
    });
    expect(failed.state).toMatchObject({ friends: [], loading: false, error: expect.any(String) });
  });

  it('accepts using the request ID and retains the confirmed change if reconciliation fails', async () => {
    const screen = await setup();
    screen.api.getFriends.mockRejectedValueOnce(new Error('offline'));
    expect(await change(screen, { kind: 'accept', requestId: 72 })).toBe(true);
    expect(screen.api.acceptRequest).toHaveBeenCalledWith(72);
    expect(screen.state.friends.map((item) => item.friendshipId)).toEqual([41, 42]);
    expect(screen.state).toMatchObject({
      receivedRequests: [],
      pendingActionId: null,
      error: expect.any(String),
    });
  });

  it('rejects using request ID and deletes using friendship ID', async () => {
    const screen = await setup();
    screen.api.getReceivedRequests.mockResolvedValue([]);
    expect(await change(screen, { kind: 'reject', requestId: 72 })).toBe(true);
    expect(screen.api.deletePendingRequest).toHaveBeenCalledWith(72);
    expect(screen.api.unfriend).not.toHaveBeenCalled();
    expect(screen.state.receivedRequests).toEqual([]);
    screen.api.getFriends.mockResolvedValue([]);
    expect(await change(screen, { kind: 'delete', friendshipId: 41 })).toBe(true);
    expect(screen.api.unfriend).toHaveBeenCalledWith(41);
    expect(screen.state.friends).toEqual([]);
  });

  it('retains rows and releases the write lock when a mutation fails', async () => {
    const screen = await setup();
    screen.api.unfriend.mockRejectedValueOnce(new Error('conflict'));
    expect(await change(screen, { kind: 'delete', friendshipId: 41 })).toBe(false);
    expect(screen.state).toMatchObject({ pendingActionId: null, error: expect.any(String) });
    expect(screen.state.friends).toHaveLength(1);
    expect(await change(screen, { kind: 'delete', friendshipId: 41 })).toBe(true);
  });

  it('blocks double presses synchronously and suppresses reads while writing', async () => {
    const write = deferred<void>();
    const screen = await setup({ unfriend: () => write.promise });
    let first!: Promise<boolean>;
    await act(async () => {
      first = screen.state.changeFriendship({ kind: 'delete', friendshipId: 41 });
      expect(await screen.state.changeFriendship({ kind: 'reject', requestId: 72 })).toBe(false);
      await screen.state.refresh();
    });
    expect(screen.api.getFriends).toHaveBeenCalledTimes(1);
    expect(screen.api.deletePendingRequest).not.toHaveBeenCalled();
    expect(screen.state.pendingActionId).toBe('friend:41');
    await act(async () => {
      write.resolve();
      expect(await first).toBe(true);
    });
  });

  it('ignores an older read arriving after a confirmed deletion', async () => {
    const screen = await setup();
    const old = deferred<FriendResponse[]>();
    screen.api.getFriends.mockReturnValueOnce(old.promise);
    let refresh!: Promise<void>;
    await act(() => {
      refresh = screen.state.refresh();
    });
    screen.api.getFriends.mockResolvedValueOnce([]);
    await change(screen, { kind: 'delete', friendshipId: 41 });
    await act(async () => {
      old.resolve([friend]);
      await refresh;
    });
    expect(screen.state.friends).toEqual([]);
  });

  it('lets the latest refresh win', async () => {
    const screen = await setup();
    const old = deferred<FriendResponse[]>();
    screen.api.getFriends.mockReturnValueOnce(old.promise).mockResolvedValueOnce([]);
    let refresh!: Promise<void>;
    await act(() => {
      refresh = screen.state.refresh();
    });
    await act(() => screen.state.refresh());
    await act(async () => {
      old.resolve([friend]);
      await refresh;
    });
    expect(screen.state.friends).toEqual([]);
  });

  it('clears data on blur and ignores old reads after refocusing', async () => {
    const screen = await setup();
    const old = deferred<FriendResponse[]>();
    screen.api.getFriends.mockReturnValueOnce(old.promise);
    let refresh!: Promise<void>;
    await act(() => {
      refresh = screen.state.refresh();
    });
    await screen.focus(false);
    expect(screen.state).toMatchObject({ friends: [], receivedRequests: [], loading: true });
    screen.api.getFriends.mockResolvedValueOnce([]);
    await screen.focus(true);
    await act(async () => {
      old.resolve([friend]);
      await refresh;
    });
    expect(screen.state.friends).toEqual([]);
  });

  it('does not let an old mutation release the refocused screen write lock', async () => {
    const old = deferred<FriendResponse>();
    const next = deferred<void>();
    const screen = await setup({ acceptRequest: () => old.promise, unfriend: () => next.promise });
    let accepting!: Promise<boolean>;
    await act(() => {
      accepting = screen.state.changeFriendship({ kind: 'accept', requestId: 72 });
    });
    await screen.focus(false);
    await screen.focus(true);
    let deleting!: Promise<boolean>;
    await act(() => {
      deleting = screen.state.changeFriendship({ kind: 'delete', friendshipId: 41 });
    });
    await act(async () => {
      old.resolve({ friendshipId: 42, user: request.user });
      expect(await accepting).toBe(false);
    });
    expect(screen.state.pendingActionId).toBe('friend:41');
    expect(screen.state.friends).toHaveLength(1);
    await act(async () => {
      next.resolve();
      await deleting;
    });
  });

  it('keeps screen instances isolated and ignores an unmounted mutation', async () => {
    const write = deferred<void>();
    const first = await setup({ unfriend: () => write.promise });
    const second = await setup();
    let deleting!: Promise<boolean>;
    await act(() => {
      deleting = first.state.changeFriendship({ kind: 'delete', friendshipId: 41 });
    });
    await act(() => first.unmount());
    await act(async () => {
      write.resolve();
      expect(await deleting).toBe(false);
    });
    expect(first.api.getFriends).toHaveBeenCalledTimes(1);
    expect(second.state).toMatchObject({ pendingActionId: null, loading: false });
    expect(second.state.friends).toHaveLength(1);
  });

  it('supports Strict Mode setup-cleanup-setup', async () => {
    const screen = await setup({}, true);
    expect(screen.state.loading).toBe(false);
    expect(screen.state.friends).toHaveLength(1);
    expect(await change(screen, { kind: 'reject', requestId: 72 })).toBe(true);
  });
});
