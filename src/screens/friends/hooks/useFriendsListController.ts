import {
  useIsFetching,
  usePrefetchQuery,
  useQueryClient,
  type QueryKey,
} from '@tanstack/react-query';
import { useRef, useState } from 'react';

import { getUserErrorMessage } from '../../../api/errors/messages';
import { normalizeError } from '../../../api/errors/normalizeError';
import {
  useAcceptRequest,
  useDeletePendingRequest,
  useUnfriend,
} from '../../../api/query-generated/friend';
import type {
  FriendReceivedRequestResponse,
  FriendResponse,
} from '../../../api/query-generated/model';
import { isCurrentAuthScope, type AuthScope } from '../../../stores/authSessionStore';
import { requireId } from '../utils/friendsListData';
import { friendsQueryOptions, receivedRequestsQueryOptions } from './friendsQueries';

type Action =
  | { kind: 'accept'; requestId: number }
  | { kind: 'reject'; requestId: number }
  | { kind: 'delete'; friendshipId: number };

export function useFriendsListController(scope: AuthScope) {
  const client = useQueryClient();
  const friendsOptions = friendsQueryOptions(scope);
  const requestsOptions = receivedRequestsQueryOptions(scope);
  // Both requests start before either child can suspend; generated keys share in-flight work.
  usePrefetchQuery(friendsOptions);
  usePrefetchQuery(requestsOptions);
  const refreshing =
    useIsFetching({
      queryKey: friendsOptions.queryKey,
      predicate: (query) => query.state.data !== undefined,
    }) +
      useIsFetching({
        queryKey: requestsOptions.queryKey,
        predicate: (query) => query.state.data !== undefined,
      }) >
    0;
  const { mutateAsync: accept } = useAcceptRequest();
  const { mutateAsync: reject } = useDeletePendingRequest();
  const { mutateAsync: remove } = useUnfriend();
  const lock = useRef(false);
  const [pendingActionId, setPendingActionId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const cancelReads = async () => {
    await Promise.all([
      client.cancelQueries({ queryKey: friendsOptions.queryKey }),
      client.cancelQueries({ queryKey: requestsOptions.queryKey }),
    ]);
  };

  const refreshKeys = async (keys: QueryKey[]) => {
    if (lock.current || !isCurrentAuthScope(scope)) return;
    setError(null);
    try {
      await Promise.all(
        keys.map((queryKey) => client.refetchQueries({ queryKey }, { throwOnError: true }))
      );
    } catch (failure) {
      // Query errors are displayed by their own region; reserve the action banner for other failures.
      if (isCurrentAuthScope(scope) && !keys.some((key) => client.getQueryState(key)?.error)) {
        setError(getUserErrorMessage(normalizeError(failure)));
      }
    }
  };
  const refresh = () => refreshKeys([friendsOptions.queryKey, requestsOptions.queryKey]);

  const changeFriendship = async (action: Action): Promise<boolean> => {
    if (lock.current || !isCurrentAuthScope(scope)) return false;
    lock.current = true;
    setError(null);
    try {
      const id = requireId(action.kind === 'delete' ? action.friendshipId : action.requestId);
      setPendingActionId(`${action.kind === 'delete' ? 'friend' : 'request'}:${id}`);
      await cancelReads();
      if (!isCurrentAuthScope(scope)) return false;
      const accepted =
        action.kind === 'accept'
          ? await accept({ requestId: id })
          : await (action.kind === 'reject'
              ? reject({ requestId: id })
              : remove({ friendshipId: id }));
      if (!isCurrentAuthScope(scope)) return false;
      // A refetch may have started while writing. Cancel its cache completion before the patch.
      await cancelReads();
      if (!isCurrentAuthScope(scope)) return false;
      if (action.kind === 'accept' && accepted) {
        client.setQueryData<FriendResponse[]>(friendsOptions.queryKey, (previous) =>
          previous
            ? [...previous.filter((item) => item.friendshipId !== accepted.friendshipId), accepted]
            : undefined
        );
      }
      if (action.kind === 'delete') {
        client.setQueryData<FriendResponse[]>(friendsOptions.queryKey, (previous) =>
          previous?.filter((item) => item.friendshipId !== id)
        );
      } else {
        client.setQueryData<FriendReceivedRequestResponse[]>(requestsOptions.queryKey, (previous) =>
          previous?.filter((item) => item.requestId !== id)
        );
      }
      // This write is confirmed. A failed reconciliation is never reported as a failed write.
      await Promise.all([
        client.invalidateQueries({ queryKey: friendsOptions.queryKey }),
        client.invalidateQueries({ queryKey: requestsOptions.queryKey }),
      ]);
      return isCurrentAuthScope(scope);
    } catch (failure) {
      if (isCurrentAuthScope(scope)) setError(getUserErrorMessage(normalizeError(failure)));
      return false;
    } finally {
      lock.current = false;
      if (isCurrentAuthScope(scope)) setPendingActionId(null);
    }
  };

  return {
    refreshing,
    error,
    pendingActionId,
    refresh,
    refreshFriends: () => refreshKeys([friendsOptions.queryKey]),
    refreshRequests: () => refreshKeys([requestsOptions.queryKey]),
    acceptRequest: (requestId: number) => changeFriendship({ kind: 'accept', requestId }),
    rejectRequest: (requestId: number) => changeFriendship({ kind: 'reject', requestId }),
    deleteFriend: (friendshipId: number) => changeFriendship({ kind: 'delete', friendshipId }),
  };
}
