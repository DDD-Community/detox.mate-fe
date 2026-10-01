import { createStore } from 'jotai/vanilla';
import { describe, expect, it, vi } from 'vitest';

import type { FriendResponse } from '../../api/generated/model';
import { filterFriendsByName, toFriendListItem, type FriendsListApi } from './friendsListData';

import {
  friendsListAtom,
  refreshFriendsListAtom,
  changeFriendshipAtom,
  resetFriendsListAtom,
} from './friendsListAtoms';

const friend: FriendResponse = {
  friendshipId: 41,
  user: { userId: 8, displayName: '홍길동', email: 'gil@example.com' },
};
const request = {
  requestId: 72,
  user: { userId: 9, displayName: '친구', email: 'friend@example.com' },
};

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (error: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

function setup(overrides: Partial<FriendsListApi> = {}) {
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
  return { api, store: createStore() };
}

describe('friend list data', () => {
  it('searches only names, trims spaces and handles case without matching an email', () => {
    const friends = [
      toFriendListItem(friend),
      toFriendListItem({ friendshipId: 44, user: { userId: 10, displayName: 'Alice' } }),
    ];
    expect(filterFriendsByName(friends, '  홍길  ')).toEqual([friends[0]]);
    expect(filterFriendsByName(friends, 'aLI')).toEqual([friends[1]]);
    expect(filterFriendsByName(friends, 'gil@example.com')).toEqual([]);
    expect(filterFriendsByName(friends, '  ')).toBe(friends);
  });

  it('keeps optional email absent and refuses a missing relationship ID', () => {
    expect(
      toFriendListItem({ friendshipId: 5, user: { userId: 6, displayName: '이름' } }).user.email
    ).toBeUndefined();
    expect(() => toFriendListItem({ user: { userId: 6 } })).toThrow();
  });

  it('loads friends and incoming requests together and stops initial loading on failure', async () => {
    const { api, store } = setup();
    await store.set(refreshFriendsListAtom, api);
    expect(store.get(friendsListAtom)).toMatchObject({
      friends: [toFriendListItem(friend)],
      receivedRequests: [request],
      loading: false,
      error: null,
    });
    const failing = setup({ getReceivedRequests: () => Promise.reject(new Error('offline')) });
    await failing.store.set(refreshFriendsListAtom, failing.api);
    expect(failing.store.get(friendsListAtom)).toMatchObject({
      friends: [],
      loading: false,
      error: '요청을 처리하지 못했어요. 잠시 후 다시 시도해주세요',
    });
  });

  it('accepts by request ID, moves the returned friendship into the list and preserves it when reconciliation fails', async () => {
    const { api, store } = setup();
    await store.set(refreshFriendsListAtom, api);
    api.getFriends.mockRejectedValueOnce(new Error('offline'));
    expect(await store.set(changeFriendshipAtom, api, { kind: 'accept', requestId: 72 })).toBe(
      true
    );
    expect(api.acceptRequest).toHaveBeenCalledWith(72);
    expect(store.get(friendsListAtom)).toMatchObject({
      receivedRequests: [],
      pendingActionId: null,
      error: '요청을 처리하지 못했어요. 잠시 후 다시 시도해주세요',
    });
    expect(store.get(friendsListAtom).friends.map((item) => item.friendshipId)).toEqual([41, 42]);
  });

  it('rejects incoming requests immediately using their request ID without deleting a friendship', async () => {
    const { api, store } = setup();
    await store.set(refreshFriendsListAtom, api);
    api.getReceivedRequests.mockResolvedValueOnce([]);
    expect(await store.set(changeFriendshipAtom, api, { kind: 'reject', requestId: 72 })).toBe(
      true
    );
    expect(api.deletePendingRequest).toHaveBeenCalledWith(72);
    expect(api.unfriend).not.toHaveBeenCalled();
    expect(store.get(friendsListAtom).receivedRequests).toEqual([]);
    expect(store.get(friendsListAtom).friends).toHaveLength(1);
  });

  it('deletes by friendship ID and returns false with existing rows intact after a server error', async () => {
    const { api, store } = setup();
    await store.set(refreshFriendsListAtom, api);
    api.unfriend.mockRejectedValueOnce(new Error('conflict'));
    expect(await store.set(changeFriendshipAtom, api, { kind: 'delete', friendshipId: 41 })).toBe(
      false
    );
    expect(api.unfriend).toHaveBeenCalledWith(41);
    expect(api.deletePendingRequest).not.toHaveBeenCalled();
    expect(store.get(friendsListAtom)).toMatchObject({
      friends: [toFriendListItem(friend)],
      pendingActionId: null,
      error: '요청을 처리하지 못했어요. 잠시 후 다시 시도해주세요',
    });
    api.getFriends.mockResolvedValueOnce([]);
    expect(await store.set(changeFriendshipAtom, api, { kind: 'delete', friendshipId: 41 })).toBe(
      true
    );
    expect(store.get(friendsListAtom).friends).toEqual([]);
  });

  it('locks synchronously against double presses and suppresses reads during a mutation', async () => {
    const write = deferred<void>();
    const { api, store } = setup({ unfriend: vi.fn(() => write.promise) });
    await store.set(refreshFriendsListAtom, api);
    const first = store.set(changeFriendshipAtom, api, { kind: 'delete', friendshipId: 41 });
    expect(store.get(friendsListAtom).pendingActionId).toBe('friend:41');
    expect(await store.set(changeFriendshipAtom, api, { kind: 'delete', friendshipId: 41 })).toBe(
      false
    );
    expect(await store.set(changeFriendshipAtom, api, { kind: 'reject', requestId: 72 })).toBe(
      false
    );
    await store.set(refreshFriendsListAtom, api);
    expect(api.getFriends).toHaveBeenCalledTimes(1);
    api.getFriends.mockResolvedValue([]);
    write.resolve(undefined);
    expect(await first).toBe(true);
    expect(api.unfriend).toHaveBeenCalledTimes(1);
    expect(api.deletePendingRequest).not.toHaveBeenCalled();
    expect(store.get(friendsListAtom).friends).toEqual([]);
  });

  it('ignores an older list response arriving after a confirmed delete', async () => {
    const oldRead = deferred<FriendResponse[]>();
    const { api, store } = setup();
    await store.set(refreshFriendsListAtom, api);
    api.getFriends.mockReturnValueOnce(oldRead.promise);
    const refreshing = store.set(refreshFriendsListAtom, api);
    api.getFriends.mockResolvedValueOnce([]);
    await store.set(changeFriendshipAtom, api, { kind: 'delete', friendshipId: 41 });
    oldRead.resolve([friend]);
    await refreshing;
    expect(store.get(friendsListAtom)).toMatchObject({
      friends: [],
      refreshing: false,
      error: null,
    });
  });

  it('lets the newest refresh win when an earlier read finishes last', async () => {
    const first = deferred<FriendResponse[]>();
    const { api, store } = setup();
    api.getFriends.mockReturnValueOnce(first.promise).mockResolvedValueOnce([]);
    const stale = store.set(refreshFriendsListAtom, api);
    await store.set(refreshFriendsListAtom, api);
    first.resolve([friend]);
    await stale;
    expect(store.get(friendsListAtom).friends).toEqual([]);
  });

  it('keeps a global reconciliation running while the screen is not subscribed', async () => {
    const reconciliation = deferred<FriendResponse[]>();
    const { api, store } = setup();
    await store.set(refreshFriendsListAtom, api);
    const unsubscribe = store.sub(friendsListAtom, () => {});
    api.getFriends.mockReturnValueOnce(reconciliation.promise);
    const deleting = store.set(changeFriendshipAtom, api, { kind: 'delete', friendshipId: 41 });
    await Promise.resolve();
    unsubscribe();
    reconciliation.resolve([]);
    expect(await deleting).toBe(true);
    expect(store.get(friendsListAtom)).toMatchObject({
      friends: [],
      refreshing: false,
      pendingActionId: null,
    });
  });

  it('clears account data and ignores an old in-flight read after a session reset', async () => {
    const oldRead = deferred<FriendResponse[]>();
    const { api, store } = setup();
    await store.set(refreshFriendsListAtom, api);
    api.getFriends.mockReturnValueOnce(oldRead.promise);
    const refreshing = store.set(refreshFriendsListAtom, api);
    store.set(resetFriendsListAtom);
    expect(store.get(friendsListAtom)).toMatchObject({
      friends: [],
      receivedRequests: [],
      loading: true,
    });
    oldRead.resolve([friend]);
    await refreshing;
    expect(store.get(friendsListAtom)).toMatchObject({
      friends: [],
      receivedRequests: [],
      loading: true,
    });
  });

  it('ignores an old mutation result without releasing the new account write lock', async () => {
    const oldWrite = deferred<FriendResponse>();
    const newWrite = deferred<void>();
    const { api, store } = setup({
      acceptRequest: () => oldWrite.promise,
      unfriend: () => newWrite.promise,
    });
    await store.set(refreshFriendsListAtom, api);
    const accepting = store.set(changeFriendshipAtom, api, { kind: 'accept', requestId: 72 });
    store.set(resetFriendsListAtom);
    await store.set(refreshFriendsListAtom, api);
    const deleting = store.set(changeFriendshipAtom, api, { kind: 'delete', friendshipId: 41 });
    oldWrite.resolve({ friendshipId: 42, user: request.user });
    expect(await accepting).toBe(false);
    expect(store.get(friendsListAtom).pendingActionId).toBe('friend:41');
    expect(store.get(friendsListAtom).friends.map((item) => item.friendshipId)).toEqual([41]);
    api.getFriends.mockResolvedValueOnce([]);
    newWrite.resolve(undefined);
    expect(await deleting).toBe(true);
    expect(store.get(friendsListAtom).friends).toEqual([]);
  });
});
