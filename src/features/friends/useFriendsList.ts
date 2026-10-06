import { useCallback, useRef, useState } from 'react';

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

type FriendsListAction =
  | { kind: 'accept'; requestId: number }
  | { kind: 'reject'; requestId: number }
  | { kind: 'delete'; friendshipId: number };

export function useFriendsList(api: FriendsListApi) {
  const [state, setState] = useState(initialState);
  const active = useRef(false);
  const lifecycle = useRef(0);
  const readRevision = useRef(0);
  const pending = useRef(false);

  const readList = useCallback(async () => {
    const revision = ++readRevision.current;
    setState((previous) => ({ ...previous, refreshing: !previous.loading, error: null }));
    try {
      const [friends, received] = await Promise.all([api.getFriends(), api.getReceivedRequests()]);
      if (revision !== readRevision.current) return;
      const nextFriends = friends.map(toFriendListItem);
      const nextRequests = received.map(toReceivedRequest);
      setState((previous) => ({
        ...previous,
        friends: nextFriends,
        receivedRequests: nextRequests,
      }));
    } catch (error) {
      if (revision !== readRevision.current) return;
      setState((previous) => ({ ...previous, error: getUserErrorMessage(normalizeError(error)) }));
    } finally {
      if (revision === readRevision.current) {
        setState((previous) => ({ ...previous, loading: false, refreshing: false }));
      }
    }
  }, [api]);

  const refresh = useCallback(async () => {
    // The mutation refreshes after the write, so a concurrent read must not race it.
    if (!active.current || pending.current) return;
    await readList();
  }, [readList]);

  const onFocus = useCallback(() => {
    active.current = true;
    void refresh();
    return () => {
      // A blurred screen may stay mounted in the navigation stack across logout.
      active.current = false;
      lifecycle.current += 1;
      readRevision.current += 1;
      pending.current = false;
      setState(initialState);
    };
  }, [refresh]);

  const changeFriendship = useCallback(
    async (action: FriendsListAction): Promise<boolean> => {
      if (!active.current || pending.current) return false;
      const id = requireId(action.kind === 'delete' ? action.friendshipId : action.requestId);
      const operationLifecycle = lifecycle.current;
      pending.current = true;
      readRevision.current += 1;
      setState((previous) => ({
        ...previous,
        pendingActionId: `${action.kind === 'delete' ? 'friend' : 'request'}:${id}`,
        loading: false,
        refreshing: false,
        error: null,
      }));
      try {
        if (action.kind === 'accept') {
          const accepted = toFriendListItem(await api.acceptRequest(id));
          if (operationLifecycle !== lifecycle.current) return false;
          setState((previous) => ({
            ...previous,
            receivedRequests: previous.receivedRequests.filter((item) => item.requestId !== id),
            friends: [
              ...previous.friends.filter((item) => item.friendshipId !== accepted.friendshipId),
              accepted,
            ],
          }));
        } else {
          await (action.kind === 'reject' ? api.deletePendingRequest(id) : api.unfriend(id));
          if (operationLifecycle !== lifecycle.current) return false;
          setState((previous) => ({
            ...previous,
            ...(action.kind === 'reject'
              ? {
                  receivedRequests: previous.receivedRequests.filter(
                    (item) => item.requestId !== id
                  ),
                }
              : { friends: previous.friends.filter((item) => item.friendshipId !== id) }),
          }));
        }
        // Preserve the confirmed change if the reconciliation read fails.
        await readList();
        return operationLifecycle === lifecycle.current;
      } catch (error) {
        if (operationLifecycle === lifecycle.current) {
          setState((previous) => ({
            ...previous,
            error: getUserErrorMessage(normalizeError(error)),
          }));
        }
        return false;
      } finally {
        if (operationLifecycle === lifecycle.current) {
          pending.current = false;
          setState((previous) => ({ ...previous, pendingActionId: null }));
        }
      }
    },
    [api, readList]
  );

  return { ...state, onFocus, refresh, changeFriendship };
}
