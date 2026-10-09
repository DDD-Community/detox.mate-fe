import { useIsFetching, usePrefetchQuery, useQueryClient, type Query } from '@tanstack/react-query';
import { CanceledError, isCancel } from 'axios';
import { useRef, useState } from 'react';

import { logError } from '../../../api/errors/logger';
import { getUserErrorMessage } from '../../../api/errors/messages';
import { normalizeError } from '../../../api/errors/normalizeError';
import {
  getGetFriendsSuspenseQueryOptions,
  getGetReceivedRequestsSuspenseQueryOptions,
  getSearchByUserCodeQueryKey,
  acceptRequest,
  deletePendingRequest,
  unfriend,
  useAcceptRequest,
  useDeletePendingRequest,
  useUnfriend,
} from '../../../api/query-generated/friend';
import { trackEvent } from '../../../lib/analytics';
import { requireId } from '../utils/friendsListData';

type Action =
  | { kind: 'accept'; requestId: number }
  | { kind: 'reject'; requestId: number }
  | { kind: 'delete'; friendshipId: number };

export function useFriendsListController() {
  const client = useQueryClient();
  const friendsOptions = getGetFriendsSuspenseQueryOptions();
  const requestsOptions = getGetReceivedRequestsSuspenseQueryOptions();
  // Both requests start before either child can suspend; generated keys share in-flight work.
  usePrefetchQuery(friendsOptions);
  usePrefetchQuery(requestsOptions);
  const cache = client.getQueryCache();
  const keys = [friendsOptions.queryKey, requestsOptions.queryKey];
  const pendingActionQueries = useRef<(Query | undefined)[] | null>(null);
  const ownsQueries = (queries = pendingActionQueries.current) =>
    queries !== null &&
    queries.every(
      (query, index) =>
        query !== undefined && cache.find({ queryKey: keys[index], exact: true }) === query
    );
  const refreshing =
    useIsFetching({
      queryKey: friendsOptions.queryKey,
      exact: true,
      predicate: (query) => query.state.data !== undefined,
    }) +
      useIsFetching({
        queryKey: requestsOptions.queryKey,
        exact: true,
        predicate: (query) => query.state.data !== undefined,
      }) >
    0;
  const { mutateAsync: accept } = useAcceptRequest({
    mutation: {
      mutationFn: ({ requestId }) => {
        if (!ownsQueries()) throw new CanceledError('The friend query was cleared.');
        return acceptRequest(requestId);
      },
    },
  });
  const { mutateAsync: reject } = useDeletePendingRequest({
    mutation: {
      mutationFn: ({ requestId }) => {
        if (!ownsQueries()) throw new CanceledError('The friend query was cleared.');
        return deletePendingRequest(requestId);
      },
    },
  });
  const { mutateAsync: remove } = useUnfriend({
    mutation: {
      mutationFn: ({ friendshipId }) => {
        if (!ownsQueries()) throw new CanceledError('The friend query was cleared.');
        return unfriend(friendshipId);
      },
    },
  });
  const lock = useRef(false);
  const [pendingActionId, setPendingActionId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const cancelReads = async () => {
    await Promise.all([
      client.cancelQueries({ queryKey: friendsOptions.queryKey, exact: true }),
      client.cancelQueries({ queryKey: requestsOptions.queryKey, exact: true }),
    ]);
  };

  const refresh = async () => {
    if (lock.current) return;
    const queries = keys.map((queryKey) => cache.find({ queryKey, exact: true }));
    setError(null);
    try {
      await Promise.all(
        keys.map((queryKey) =>
          client.refetchQueries({ queryKey, exact: true }, { throwOnError: true })
        )
      );
    } catch (failure) {
      if (isCancel(failure) || !ownsQueries(queries)) return;
      // Query errors are displayed by their own region; reserve the action banner for other failures.
      if (!keys.some((key) => client.getQueryState(key)?.error)) {
        logError(normalizeError(failure), { scope: 'api', operation: 'refreshFriends' });
        setError(getUserErrorMessage(normalizeError(failure)));
      }
    }
  };

  const reconcile = async () => {
    await Promise.all([
      client.invalidateQueries({ queryKey: friendsOptions.queryKey, exact: true }),
      client.invalidateQueries({ queryKey: requestsOptions.queryKey, exact: true }),
      client.invalidateQueries({ queryKey: getSearchByUserCodeQueryKey() }),
    ]);
  };

  const changeFriendship = async (action: Action): Promise<boolean> => {
    if (lock.current) return false;
    const queries = keys.map((queryKey) => cache.find({ queryKey, exact: true }));
    const ownsActionQueries = () => ownsQueries(queries);
    if (!ownsActionQueries()) return false;
    lock.current = true;
    pendingActionQueries.current = queries;
    setError(null);
    try {
      const id = requireId(action.kind === 'delete' ? action.friendshipId : action.requestId);
      setPendingActionId(`${action.kind === 'delete' ? 'friend' : 'request'}:${id}`);
      await cancelReads();
      if (!ownsActionQueries()) return false;
      const accepted =
        action.kind === 'accept'
          ? await accept({ requestId: id })
          : await (action.kind === 'reject'
              ? reject({ requestId: id })
              : remove({ friendshipId: id }));
      if (!ownsActionQueries()) return false;
      // A refetch may have started while writing. Cancel its cache completion before the patch.
      await cancelReads();
      if (!ownsActionQueries()) return false;
      if (action.kind === 'accept' && accepted) {
        client.setQueryData(friendsOptions.queryKey, (previous) =>
          previous
            ? [...previous.filter((item) => item.friendshipId !== accepted.friendshipId), accepted]
            : undefined
        );
      }
      if (action.kind === 'delete') {
        client.setQueryData(friendsOptions.queryKey, (previous) =>
          previous?.filter((item) => item.friendshipId !== id)
        );
      } else {
        client.setQueryData(requestsOptions.queryKey, (previous) =>
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
        if (!isCancel(failure) && ownsActionQueries()) {
          logError(normalizeError(failure), { scope: 'api', operation: 'reconcileFriendship' });
        }
      });
      return true;
    } catch (failure) {
      if (isCancel(failure)) return false;
      if (ownsActionQueries()) {
        const appError = normalizeError(failure);
        logError(appError, { scope: 'api', operation: 'changeFriendship' });
        setError(getUserErrorMessage(appError));
      }
      return false;
    } finally {
      if (pendingActionQueries.current === queries) pendingActionQueries.current = null;
      lock.current = false;
      setPendingActionId(null);
    }
  };

  return {
    refreshing,
    error,
    pendingActionId,
    refresh,
    acceptRequest: (requestId: number) => changeFriendship({ kind: 'accept', requestId }),
    rejectRequest: (requestId: number) => changeFriendship({ kind: 'reject', requestId }),
    deleteFriend: (friendshipId: number) => changeFriendship({ kind: 'delete', friendshipId }),
  };
}
