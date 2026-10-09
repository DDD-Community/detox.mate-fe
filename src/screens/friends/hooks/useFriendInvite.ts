import { useQueryClient, useSuspenseQuery } from '@tanstack/react-query';
import { useEffect, useRef, useState } from 'react';

import { AppError, getUserErrorMessage, logError, normalizeError } from '../../../api/errors';
import {
  getGetInviteeSuspenseQueryOptions,
  useSendRequest,
} from '../../../api/query-generated/friend';

import { trackEvent } from '../../../lib/analytics';

export function useFriendInvite(code: string) {
  const client = useQueryClient();
  const options = getGetInviteeSuspenseQueryOptions(code);
  const result = useSuspenseQuery(options);
  const { mutateAsync } = useSendRequest();
  const lock = useRef(false);
  const mounted = useRef(true);
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  const invitee = result.data;
  if (
    !Number.isSafeInteger(invitee.userId) ||
    (invitee.userId ?? 0) <= 0 ||
    !invitee.displayName ||
    !['NONE', 'PENDING_SENT', 'PENDING_RECEIVED', 'FRIEND', 'SELF'].includes(
      invitee.relationshipStatus ?? ''
    )
  ) {
    throw AppError({ type: 'unknown', message: '초대 정보를 불러오지 못했어요.' });
  }

  const sendRequest = async (): Promise<boolean> => {
    if (lock.current) return false;
    const cache = client.getQueryCache();
    const query = cache.find({ queryKey: options.queryKey, exact: true });
    const ownsQuery = () =>
      mounted.current &&
      query !== undefined &&
      cache.find({ queryKey: options.queryKey, exact: true }) === query;
    const current = client.getQueryData(options.queryKey);
    if (!ownsQuery() || current?.relationshipStatus !== 'NONE') return false;
    lock.current = true;
    setSending(true);
    setSendError(null);
    try {
      await client.cancelQueries({ queryKey: options.queryKey, exact: true });
      if (!ownsQuery()) return false;
      const response = await mutateAsync({ data: { targetUserId: invitee.userId! } });
      if (!ownsQuery()) return false;
      // Reads started during the write must not overwrite the confirmed relationship.
      await client.cancelQueries({ queryKey: options.queryKey, exact: true });
      if (!ownsQuery()) return false;
      client.setQueryData(options.queryKey, (previous) =>
        previous
          ? {
              ...previous,
              relationshipStatus: 'PENDING_SENT' as const,
              requestId: response.requestId,
            }
          : undefined
      );
      trackEvent('Friend Request Sent', { entry_point: 'invite_link' });
      // A failed reconciliation keeps the confirmed write and offers a read-only retry.
      void client.invalidateQueries({ queryKey: options.queryKey, exact: true });
      return true;
    } catch (failure) {
      const error = normalizeError(failure);
      logError(error, { scope: 'api', operation: 'friends.invite.send' });
      if (ownsQuery()) setSendError(getUserErrorMessage(error));
      return false;
    } finally {
      lock.current = false;
      if (mounted.current) setSending(false);
    }
  };

  const refresh = async () => {
    try {
      await client.refetchQueries(
        { queryKey: options.queryKey, exact: true },
        { throwOnError: true }
      );
    } catch (failure) {
      logError(normalizeError(failure), { scope: 'api', operation: 'friends.invite.refresh' });
      // The query feedback owns the user-facing read error.
    }
  };

  return {
    invitee,
    sending,
    sendError,
    readError: !result.isFetching ? result.error : null,
    sendRequest,
    refresh,
  };
}
