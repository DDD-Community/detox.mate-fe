import { useIsMutating, useQueryClient } from '@tanstack/react-query';
import { isCancel } from 'axios';
import { useEffect, useRef, useState } from 'react';

import { getUserErrorMessage } from '../../../api/errors/messages';
import { normalizeError } from '../../../api/errors/normalizeError';
import { logError } from '../../../api/errors/logger';
import { getSendRequestMutationOptions, useSendRequest } from '../../../api/query-generated/friend';
import type { FriendSearchResponse } from '../../../api/query-generated/model';
import { isCurrentAuthQueryScope, type AuthQueryScope } from '../../../lib/query/authQueryScope';
import { trackEvent } from '../../../lib/analytics';
import { guardFriendMutation, searchQueryOptions } from '../utils/friendsQueryOptions';
import { requireId } from '../utils/friendsListData';

export function useSendFriendRequest(
  email: string,
  user: FriendSearchResponse,
  scope: AuthQueryScope
) {
  const client = useQueryClient();
  const options = searchQueryOptions(email, scope);
  const mutationKey = ['friends-send', scope, user.userId];
  const activeWrites = useIsMutating({ mutationKey, exact: true });
  const { mutateAsync } = useSendRequest({
    mutation: guardFriendMutation(
      getSendRequestMutationOptions({ mutation: { mutationKey } }),
      scope
    ),
  });
  const locked = useRef(false);
  const mounted = useRef(true);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    if (user.relationshipStatus !== 'NONE' && user.relationshipStatus !== 'SELF') setError(null);
  }, [user.relationshipStatus]);
  // The component is keyed by the current confirmed email and auth scope.
  // A removed query's old mutation must never recreate a cache in a new session.
  const send = async () => {
    if (!mounted.current || locked.current || activeWrites || !isCurrentAuthQueryScope(scope))
      return;
    if (user.relationshipStatus !== 'NONE' && user.relationshipStatus !== 'SELF') return;
    const query = client.getQueryCache().find({ queryKey: options.queryKey, exact: true });
    const currentUser = query?.state.data as FriendSearchResponse | undefined;
    if (
      !query ||
      currentUser?.userId !== user.userId ||
      (currentUser?.relationshipStatus !== 'NONE' && currentUser?.relationshipStatus !== 'SELF')
    )
      return;
    const ownsResult = () =>
      isCurrentAuthQueryScope(scope) &&
      client.getQueryCache().find({ queryKey: options.queryKey, exact: true }) === query;
    locked.current = true;
    setPending(true);
    setError(null);
    try {
      const targetUserId = requireId(user.userId);
      const response = await mutateAsync({ data: { targetUserId } });
      if (!ownsResult()) return;
      await client.cancelQueries({ queryKey: options.queryKey, exact: true });
      if (!ownsResult()) return;
      client.setQueryData<FriendSearchResponse>(options.queryKey, (previous) => ({
        ...previous,
        ...response.user,
        relationshipStatus: 'PENDING_SENT',
        requestId: response.requestId,
      }));
      try {
        trackEvent('Friend Request Sent');
      } catch (failure) {
        logError(normalizeError(failure), { scope: 'api', operation: 'logFriendRequestSent' });
      }
      // Keep the confirmed result while allowing the next visit to reconcile with the server.
      void client.invalidateQueries({
        queryKey: options.queryKey,
        exact: true,
        refetchType: 'none',
      });
    } catch (failure) {
      if (isCancel(failure) || !ownsResult()) return;
      const appError = normalizeError(failure);
      logError(appError, { scope: 'api', operation: 'sendFriendRequest' });
      if (mounted.current) setError(getUserErrorMessage(appError));
      if (appError.status === 409) {
        void client.invalidateQueries({ queryKey: options.queryKey, exact: true });
      }
    } finally {
      locked.current = false;
      if (mounted.current && isCurrentAuthQueryScope(scope)) setPending(false);
    }
  };
  return { send, pending: pending || activeWrites > 0, error };
}
