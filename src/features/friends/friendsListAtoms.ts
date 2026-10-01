import { atom } from 'jotai/vanilla';

import { getUserErrorMessage } from '../../api/errors/messages';
import { normalizeError } from '../../api/errors/normalizeError';
import {
  requireId,
  toFriendListItem,
  toReceivedRequest,
  type FriendsListApi,
  type FriendsListState,
} from './friendsListData';

const initialState: FriendsListState = {
  friends: [],
  receivedRequests: [],
  loading: true,
  refreshing: false,
  error: null,
  pendingActionId: null,
};

export const friendsListAtom = atom(initialState);
const readRevisionAtom = atom(0);
const sessionRevisionAtom = atom(0);

// Reset on login/logout, invalidating requests from the previous account as well.
export const resetFriendsListAtom = atom(null, (get, set) => {
  set(sessionRevisionAtom, get(sessionRevisionAtom) + 1);
  set(readRevisionAtom, get(readRevisionAtom) + 1);
  set(friendsListAtom, initialState);
});

const readFriendsListAtom = atom(null, async (get, set, api: FriendsListApi) => {
  const revision = get(readRevisionAtom) + 1;
  set(readRevisionAtom, revision);
  set(friendsListAtom, (state) => ({ ...state, refreshing: !state.loading, error: null }));
  try {
    const [friends, received] = await Promise.all([api.getFriends(), api.getReceivedRequests()]);
    if (revision !== get(readRevisionAtom)) return;
    set(friendsListAtom, (state) => ({
      ...state,
      friends: friends.map(toFriendListItem),
      receivedRequests: received.map(toReceivedRequest),
    }));
  } catch (error) {
    if (revision !== get(readRevisionAtom)) return;
    set(friendsListAtom, (state) => ({
      ...state,
      error: getUserErrorMessage(normalizeError(error)),
    }));
  } finally {
    if (revision === get(readRevisionAtom)) {
      set(friendsListAtom, (state) => ({ ...state, loading: false, refreshing: false }));
    }
  }
});

export const refreshFriendsListAtom = atom(null, async (get, set, api: FriendsListApi) => {
  // The mutation performs its own refresh; a concurrent read could return pre-write data.
  if (get(friendsListAtom).pendingActionId) return;
  await set(readFriendsListAtom, api);
});

type FriendsListAction =
  | { kind: 'accept'; requestId: number }
  | { kind: 'reject'; requestId: number }
  | { kind: 'delete'; friendshipId: number };

export const changeFriendshipAtom = atom(
  null,
  async (get, set, api: FriendsListApi, action: FriendsListAction): Promise<boolean> => {
    if (get(friendsListAtom).pendingActionId) return false;
    const session = get(sessionRevisionAtom);
    const id = requireId(action.kind === 'delete' ? action.friendshipId : action.requestId);
    set(readRevisionAtom, get(readRevisionAtom) + 1);
    set(friendsListAtom, (state) => ({
      ...state,
      pendingActionId: `${action.kind === 'delete' ? 'friend' : 'request'}:${id}`,
      loading: false,
      refreshing: false,
      error: null,
    }));
    try {
      if (action.kind === 'accept') {
        const accepted = toFriendListItem(await api.acceptRequest(id));
        if (session !== get(sessionRevisionAtom)) return false;
        set(friendsListAtom, (state) => ({
          ...state,
          receivedRequests: state.receivedRequests.filter((item) => item.requestId !== id),
          friends: [
            ...state.friends.filter((item) => item.friendshipId !== accepted.friendshipId),
            accepted,
          ],
        }));
      } else {
        await (action.kind === 'reject' ? api.deletePendingRequest(id) : api.unfriend(id));
        if (session !== get(sessionRevisionAtom)) return false;
        set(friendsListAtom, (state) => ({
          ...state,
          ...(action.kind === 'reject'
            ? { receivedRequests: state.receivedRequests.filter((item) => item.requestId !== id) }
            : { friends: state.friends.filter((item) => item.friendshipId !== id) }),
        }));
      }
      // Keep the confirmed local change if this reconciliation read fails.
      await set(readFriendsListAtom, api);
      return session === get(sessionRevisionAtom);
    } catch (error) {
      if (session === get(sessionRevisionAtom)) {
        set(friendsListAtom, (state) => ({
          ...state,
          error: getUserErrorMessage(normalizeError(error)),
        }));
      }
      return false;
    } finally {
      if (session === get(sessionRevisionAtom)) {
        set(friendsListAtom, (state) => ({ ...state, pendingActionId: null }));
      }
    }
  }
);
