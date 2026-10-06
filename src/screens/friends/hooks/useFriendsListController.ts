import {
  useIsFetching,
  usePrefetchQuery,
  useQueryClient,
  type QueryKey,
} from '@tanstack/react-query';
import { isCancel } from 'axios';
import { useRef, useState } from 'react';

import { logError } from '../../../api/errors/logger';
import { getUserErrorMessage } from '../../../api/errors/messages';
import { normalizeError } from '../../../api/errors/normalizeError';
import {
  getAcceptRequestMutationOptions,
  getDeletePendingRequestMutationOptions,
  getUnfriendMutationOptions,
  useAcceptRequest,
  useDeletePendingRequest,
  useUnfriend,
} from '../../../api/query-generated/friend';
import type {
  FriendReceivedRequestResponse,
  FriendResponse,
} from '../../../api/query-generated/model';
import { isCurrentAuthQueryScope, type AuthQueryScope } from '../../../lib/query/authQueryScope';
import { trackEvent } from '../../../lib/analytics';
import {
  friendsQueryOptions,
  receivedQueryOptions,
  isScopeSearch,
  guardFriendMutation,
} from '../utils/friendsQueryOptions';
import { requireId } from '../utils/friendsListData';

type Action =
  | { kind: 'accept'; requestId: number }
  | { kind: 'reject'; requestId: number }
  | { kind: 'delete'; friendshipId: number };

export function useFriendsListController(scope?: AuthQueryScope) {
  const client = useQueryClient();
  const friendsOptions = friendsQueryOptions(scope);
  const requestsOptions = receivedQueryOptions(scope);
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
  const { mutateAsync: accept } = useAcceptRequest({
    mutation: guardFriendMutation(getAcceptRequestMutationOptions(), scope),
  });
  const { mutateAsync: reject } = useDeletePendingRequest({
    mutation: guardFriendMutation(getDeletePendingRequestMutationOptions(), scope),
  });
  const { mutateAsync: remove } = useUnfriend({
    mutation: guardFriendMutation(getUnfriendMutationOptions(), scope),
  });
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
    if (lock.current) return;
    setError(null);
    try {
      await Promise.all(
        keys.map((queryKey) => client.refetchQueries({ queryKey }, { throwOnError: true }))
      );
    } catch (failure) {
      if (isCancel(failure) || (scope && !isCurrentAuthQueryScope(scope))) return;
      // Query errors are displayed by their own region; reserve the action banner for other failures.
      if (!keys.some((key) => client.getQueryState(key)?.error)) {
        logError(normalizeError(failure), { scope: 'api', operation: 'refreshFriends' });
        setError(getUserErrorMessage(normalizeError(failure)));
      }
    }
  };
  const refresh = () => refreshKeys([friendsOptions.queryKey, requestsOptions.queryKey]);

  const reconcile = async () => {
    await Promise.all([
      client.invalidateQueries({ queryKey: friendsOptions.queryKey }),
      client.invalidateQueries({ queryKey: requestsOptions.queryKey }),
      client.invalidateQueries({ predicate: (query) => isScopeSearch(query.queryKey, scope) }),
    ]);
  };

  const changeFriendship = async (action: Action): Promise<boolean> => {
    if (lock.current) return false;
    const cache = client.getQueryCache();
    const keys = [friendsOptions.queryKey, requestsOptions.queryKey];
    const queries = keys.map((queryKey) => cache.find({ queryKey, exact: true }));
    const ownsQueries = () =>
      (!scope || isCurrentAuthQueryScope(scope)) &&
      queries.every(
        (query, index) =>
          query !== undefined && cache.find({ queryKey: keys[index], exact: true }) === query
      );
    if (!ownsQueries()) return false;
    lock.current = true;
    setError(null);
    try {
      const id = requireId(action.kind === 'delete' ? action.friendshipId : action.requestId);
      setPendingActionId(`${action.kind === 'delete' ? 'friend' : 'request'}:${id}`);
      await cancelReads();
      if (!ownsQueries()) return false;
      const accepted =
        action.kind === 'accept'
          ? await accept({ requestId: id })
          : await (action.kind === 'reject'
              ? reject({ requestId: id })
              : remove({ friendshipId: id }));
      if (!ownsQueries()) return false;
      // A refetch may have started while writing. Cancel its cache completion before the patch.
      await cancelReads();
      if (!ownsQueries()) return false;
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
      try {
        trackEvent(
          action.kind === 'accept'
            ? 'Friend Request Accepted'
            : action.kind === 'reject'
              ? 'Friend Request Rejected'
              : 'Friend Removed'
        );
      } catch (failure) {
        logError(normalizeError(failure), { scope: 'api', operation: 'logFriendshipSuccess' });
      }
      // The write is confirmed; reconciliation belongs to the query regions, not the action pending.
      void reconcile().catch((failure) => {
        if (!isCancel(failure) && (!scope || isCurrentAuthQueryScope(scope))) {
          logError(normalizeError(failure), { scope: 'api', operation: 'reconcileFriendship' });
        }
      });
      return true;
    } catch (failure) {
      if (isCancel(failure)) return false;
      if (ownsQueries()) {
        const appError = normalizeError(failure);
        logError(appError, { scope: 'api', operation: 'changeFriendship' });
        setError(getUserErrorMessage(appError));
      }
      return false;
    } finally {
      lock.current = false;
      setPendingActionId(null);
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
