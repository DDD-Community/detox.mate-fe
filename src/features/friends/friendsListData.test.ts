import { describe, expect, it, vi } from 'vitest';

import type { FriendResponse } from '../../api/generated/model';
import {
  createFriendsListStore,
  filterFriendsByName,
  toFriendListItem,
  type FriendsListApi,
} from './friendsListData';

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
  return { api, store: createFriendsListStore(api, () => '다시 시도해주세요.') };
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
    const { store } = setup();
    await store.refresh();
    expect(store.getSnapshot()).toMatchObject({
      friends: [toFriendListItem(friend)],
      receivedRequests: [request],
      loading: false,
      error: null,
    });
    const failing = setup({ getReceivedRequests: () => Promise.reject(new Error('offline')) });
    await failing.store.refresh();
    expect(failing.store.getSnapshot()).toMatchObject({
      friends: [],
      loading: false,
      error: '다시 시도해주세요.',
    });
  });

  it('accepts by request ID, moves the returned friendship into the list and preserves it when reconciliation fails', async () => {
    const { api, store } = setup();
    await store.refresh();
    api.getFriends.mockRejectedValueOnce(new Error('offline'));
    expect(await store.acceptRequest(72)).toBe(true);
    expect(api.acceptRequest).toHaveBeenCalledWith(72);
    expect(store.getSnapshot()).toMatchObject({
      receivedRequests: [],
      pendingActionId: null,
      error: '다시 시도해주세요.',
    });
    expect(store.getSnapshot().friends.map((item) => item.friendshipId)).toEqual([41, 42]);
  });

  it('rejects incoming requests immediately using their request ID without deleting a friendship', async () => {
    const { api, store } = setup();
    await store.refresh();
    api.getReceivedRequests.mockResolvedValueOnce([]);
    expect(await store.rejectRequest(72)).toBe(true);
    expect(api.deletePendingRequest).toHaveBeenCalledWith(72);
    expect(api.unfriend).not.toHaveBeenCalled();
    expect(store.getSnapshot().receivedRequests).toEqual([]);
    expect(store.getSnapshot().friends).toHaveLength(1);
  });

  it('deletes by friendship ID and returns false with existing rows intact after a server error', async () => {
    const { api, store } = setup();
    await store.refresh();
    api.unfriend.mockRejectedValueOnce(new Error('conflict'));
    expect(await store.deleteFriend(41)).toBe(false);
    expect(api.unfriend).toHaveBeenCalledWith(41);
    expect(api.deletePendingRequest).not.toHaveBeenCalled();
    expect(store.getSnapshot()).toMatchObject({
      friends: [toFriendListItem(friend)],
      pendingActionId: null,
      error: '다시 시도해주세요.',
    });
    api.getFriends.mockResolvedValueOnce([]);
    expect(await store.deleteFriend(41)).toBe(true);
    expect(store.getSnapshot().friends).toEqual([]);
  });

  it('locks synchronously against double presses and suppresses reads during a mutation', async () => {
    const write = deferred<void>();
    const { api, store } = setup({ unfriend: vi.fn(() => write.promise) });
    await store.refresh();
    const first = store.deleteFriend(41);
    expect(store.getSnapshot().pendingActionId).toBe('friend:41');
    expect(await store.deleteFriend(41)).toBe(false);
    expect(await store.rejectRequest(72)).toBe(false);
    await store.refresh();
    expect(api.getFriends).toHaveBeenCalledTimes(1);
    api.getFriends.mockResolvedValue([]);
    write.resolve(undefined);
    expect(await first).toBe(true);
    expect(api.unfriend).toHaveBeenCalledTimes(1);
    expect(api.deletePendingRequest).not.toHaveBeenCalled();
    expect(store.getSnapshot().friends).toEqual([]);
  });

  it('ignores an older list response arriving after a confirmed delete', async () => {
    const oldRead = deferred<FriendResponse[]>();
    const { api, store } = setup();
    await store.refresh();
    api.getFriends.mockReturnValueOnce(oldRead.promise);
    const refreshing = store.refresh();
    api.getFriends.mockResolvedValueOnce([]);
    await store.deleteFriend(41);
    oldRead.resolve([friend]);
    await refreshing;
    expect(store.getSnapshot()).toMatchObject({ friends: [], refreshing: false, error: null });
  });

  it('lets the newest refresh win when an earlier read finishes last', async () => {
    const first = deferred<FriendResponse[]>();
    const { api, store } = setup();
    api.getFriends.mockReturnValueOnce(first.promise).mockResolvedValueOnce([]);
    const stale = store.refresh();
    await store.refresh();
    first.resolve([friend]);
    await stale;
    expect(store.getSnapshot().friends).toEqual([]);
  });

  it('clears read flags on blur during mutation reconciliation and permits a fresh read on return', async () => {
    const reconciliation = deferred<FriendResponse[]>();
    const { api, store } = setup();
    await store.refresh();
    api.getFriends.mockReturnValueOnce(reconciliation.promise);
    const deleting = store.deleteFriend(41);
    await Promise.resolve();
    expect(store.getSnapshot().refreshing).toBe(true);
    store.cancelRefresh();
    reconciliation.resolve([friend]);
    await deleting;
    expect(store.getSnapshot()).toMatchObject({
      friends: [],
      loading: false,
      refreshing: false,
      pendingActionId: null,
    });
    api.getFriends.mockResolvedValueOnce([]);
    await store.refresh();
    expect(api.getFriends).toHaveBeenCalledTimes(3);
    expect(store.getSnapshot().friends).toEqual([]);
  });

  it('queues focus refresh during a blur-canceled reconciliation and captures a new incoming request', async () => {
    const reconciliation = deferred<FriendResponse[]>();
    const freshRead = deferred<FriendResponse[]>();
    const { api, store } = setup();
    await store.refresh();
    api.getFriends
      .mockReturnValueOnce(reconciliation.promise)
      .mockReturnValueOnce(freshRead.promise);
    const deleting = store.deleteFriend(41);
    await Promise.resolve();
    store.cancelRefresh();
    await store.refresh();
    expect(api.getFriends).toHaveBeenCalledTimes(2);
    const incoming = { requestId: 73, user: { userId: 11, displayName: '새 친구' } };
    api.getReceivedRequests.mockResolvedValueOnce([incoming]);
    reconciliation.resolve([friend]);
    await vi.waitFor(() => expect(api.getFriends).toHaveBeenCalledTimes(3));
    expect(store.getSnapshot().friends).toEqual([]);
    expect(await store.rejectRequest(72)).toBe(false);
    freshRead.resolve([]);
    expect(await deleting).toBe(true);
    expect(store.getSnapshot()).toMatchObject({
      friends: [],
      receivedRequests: [incoming],
      pendingActionId: null,
      refreshing: false,
    });
  });

  it('runs a queued focus refresh after a failed write while keeping its failure message', async () => {
    const write = deferred<void>();
    const { api, store } = setup({ unfriend: () => write.promise });
    await store.refresh();
    const deleting = store.deleteFriend(41);
    store.cancelRefresh();
    await store.refresh();
    const incoming = { requestId: 73, user: { userId: 11, displayName: '새 친구' } };
    api.getReceivedRequests.mockResolvedValueOnce([incoming]);
    write.reject(new Error('offline'));
    expect(await deleting).toBe(false);
    expect(api.getFriends).toHaveBeenCalledTimes(2);
    expect(store.getSnapshot()).toMatchObject({
      friends: [toFriendListItem(friend)],
      receivedRequests: [incoming],
      pendingActionId: null,
      error: '다시 시도해주세요.',
    });
  });
});
