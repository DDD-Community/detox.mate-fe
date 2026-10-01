import type { FriendReceivedRequestResponse, FriendResponse } from '../../api/generated/model';

export interface FriendListUser {
  userId: number;
  displayName: string;
  profileImageUrl?: string;
  email?: string;
}

export interface FriendsListItem {
  friendshipId: number;
  user: FriendListUser;
}

export interface FriendReceivedRequest {
  requestId: number;
  user: FriendListUser;
}

export interface FriendsListApi {
  getFriends: () => Promise<FriendResponse[]>;
  getReceivedRequests: () => Promise<FriendReceivedRequestResponse[]>;
  acceptRequest: (requestId: number) => Promise<FriendResponse>;
  deletePendingRequest: (requestId: number) => Promise<void>;
  unfriend: (friendshipId: number) => Promise<void>;
}

function requireId(value: number | undefined): number {
  if (!Number.isSafeInteger(value) || value == null || value <= 0) {
    throw new Error('친구 정보를 불러오지 못했어요. 다시 시도해주세요.');
  }
  return value;
}

function toUser(user: FriendResponse['user']): FriendListUser {
  return {
    userId: requireId(user?.userId),
    displayName: user?.displayName ?? '이름 없음',
    profileImageUrl: user?.profileImageUrl,
    email: user?.email,
  };
}

export function toFriendListItem(friend: FriendResponse): FriendsListItem {
  return { friendshipId: requireId(friend.friendshipId), user: toUser(friend.user) };
}

export function toReceivedRequest(request: FriendReceivedRequestResponse): FriendReceivedRequest {
  return { requestId: requireId(request.requestId), user: toUser(request.user) };
}

export function filterFriendsByName(friends: FriendsListItem[], query: string): FriendsListItem[] {
  const name = query.trim().toLocaleLowerCase();
  if (!name) return friends;
  return friends.filter((friend) => friend.user.displayName.toLocaleLowerCase().includes(name));
}

export interface FriendsListState {
  friends: FriendsListItem[];
  receivedRequests: FriendReceivedRequest[];
  loading: boolean;
  refreshing: boolean;
  error: string | null;
  pendingActionId: string | null;
}

type FriendsListAction =
  | { kind: 'accept'; requestId: number }
  | { kind: 'reject'; requestId: number }
  | { kind: 'delete'; friendshipId: number };

/** One screen owns one store, so an old read cannot undo a completed relationship change. */
export function createFriendsListStore(
  api: FriendsListApi,
  getErrorMessage: (error: unknown) => string
) {
  let state: FriendsListState = {
    friends: [],
    receivedRequests: [],
    loading: true,
    refreshing: false,
    error: null,
    pendingActionId: null,
  };
  let readRevision = 0;
  let loaded = false;
  let refreshQueued = false;
  const listeners = new Set<() => void>();

  const update = (changes: Partial<FriendsListState>) => {
    state = { ...state, ...changes };
    listeners.forEach((listener) => listener());
  };

  const read = async (mutationError?: string) => {
    const revision = ++readRevision;
    update({ loading: !loaded, refreshing: loaded, error: mutationError ?? null });
    try {
      const [friends, received] = await Promise.all([api.getFriends(), api.getReceivedRequests()]);
      if (revision !== readRevision) return;
      update({
        friends: friends.map(toFriendListItem),
        receivedRequests: received.map(toReceivedRequest),
      });
    } catch (error) {
      if (revision === readRevision) update({ error: mutationError ?? getErrorMessage(error) });
    } finally {
      if (revision === readRevision) {
        loaded = true;
        update({ loading: false, refreshing: false });
      }
    }
  };

  const refresh = async () => {
    // A read during a write can return its old state even after the write succeeds.
    if (state.pendingActionId) {
      refreshQueued = true;
      return;
    }
    await read();
  };

  const mutate = async (action: FriendsListAction): Promise<boolean> => {
    if (state.pendingActionId) return false;
    const id = action.kind === 'delete' ? action.friendshipId : action.requestId;
    requireId(id);
    ++readRevision;
    update({
      pendingActionId: `${action.kind === 'delete' ? 'friend' : 'request'}:${id}`,
      loading: false,
      refreshing: false,
      error: null,
    });
    let mutationError: string | null = null;
    try {
      if (action.kind === 'accept') {
        const accepted = toFriendListItem(await api.acceptRequest(action.requestId));
        update({
          receivedRequests: state.receivedRequests.filter((item) => item.requestId !== id),
          friends: [
            ...state.friends.filter((item) => item.friendshipId !== accepted.friendshipId),
            accepted,
          ],
        });
      } else if (action.kind === 'reject') {
        await api.deletePendingRequest(action.requestId);
        update({
          receivedRequests: state.receivedRequests.filter((item) => item.requestId !== id),
        });
      } else {
        await api.unfriend(action.friendshipId);
        update({ friends: state.friends.filter((item) => item.friendshipId !== id) });
      }
    } catch (error) {
      mutationError = getErrorMessage(error);
      update({ error: mutationError });
    }

    // Keep the confirmed local change if this reconciliation read fails.
    if (mutationError === null) await read();
    // A focus event may arrive while a blur-canceled reconciliation is still pending.
    // Keep the write lock until every queued read has reconciled the latest screen state.
    while (refreshQueued) {
      refreshQueued = false;
      await read(mutationError ?? undefined);
    }
    update({ pendingActionId: null });
    return mutationError === null;
  };

  return {
    getSnapshot: () => state,
    subscribe: (listener: () => void) => {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    refresh,
    cancelRefresh: () => {
      ++readRevision;
      update({ loading: false, refreshing: false });
    },
    acceptRequest: (requestId: number) => mutate({ kind: 'accept', requestId }),
    rejectRequest: (requestId: number) => mutate({ kind: 'reject', requestId }),
    deleteFriend: (friendshipId: number) => mutate({ kind: 'delete', friendshipId }),
  };
}
