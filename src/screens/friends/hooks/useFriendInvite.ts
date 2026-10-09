import { useQueryClient, useSuspenseQuery } from '@tanstack/react-query';
import { isCancel } from 'axios';
import { useEffect, useRef, useState } from 'react';

import { AppError, getUserErrorMessage, logError, normalizeError } from '../../../api/errors';
import {
  getGetInviteeSuspenseQueryOptions,
  useSendRequest,
} from '../../../api/query-generated/friend';
import { FriendRelationshipStatus } from '../../../api/query-generated/model';
import type { FriendRequestResponse } from '../../../api/query-generated/model';

import { trackEvent } from '../../../lib/analytics';
import { requireId } from '../utils/friendsListData';

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
  const userId = requireId(invitee.userId);
  if (
    !invitee.displayName ||
    !invitee.relationshipStatus ||
    !Object.values(FriendRelationshipStatus).includes(invitee.relationshipStatus)
  ) {
    throw AppError({ type: 'unknown', message: '초대 정보를 불러오지 못했어요.' });
  }

  const applySentRequest = async (response: FriendRequestResponse, ownsQuery: () => boolean) => {
    if (!ownsQuery()) return;
    // Reads started during the write must not overwrite the confirmed relationship.
    await client.cancelQueries({ queryKey: options.queryKey, exact: true });
    if (!ownsQuery()) return;
    client.setQueryData(options.queryKey, (previous) =>
      previous
        ? {
            ...previous,
            relationshipStatus: FriendRelationshipStatus.PENDING_SENT,
            requestId: response.requestId,
          }
        : undefined
    );
    logFriendRequestSent();
    // A failed reconciliation keeps the confirmed write and offers a read-only retry.
    void client.invalidateQueries({ queryKey: options.queryKey, exact: true });
  };

  const sendRequest = async (): Promise<void> => {
    if (lock.current) return;
    const cache = client.getQueryCache();
    const query = cache.find({ queryKey: options.queryKey, exact: true });
    const ownsQuery = () =>
      mounted.current &&
      query !== undefined &&
      cache.find({ queryKey: options.queryKey, exact: true }) === query;
    const current = client.getQueryData(options.queryKey);
    if (!ownsQuery() || current?.relationshipStatus !== FriendRelationshipStatus.NONE) return;
    lock.current = true;
    setSending(true);
    setSendError(null);
    try {
      const response = await mutateAsync({ data: { targetUserId: userId } });
      await applySentRequest(response, ownsQuery);
    } catch (failure) {
      if (isCancel(failure) || !ownsQuery()) return;
      const error = normalizeError(failure);
      logError(error, { scope: 'api', operation: 'friends.invite.send' });
      setSendError(getUserErrorMessage(error));
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
      if (isCancel(failure)) return;
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

function logFriendRequestSent() {
  try {
    trackEvent('Friend Request Sent', { entry_point: 'invite_link' });
  } catch (failure) {
    logError(normalizeError(failure), { scope: 'api', operation: 'logFriendRequestSent' });
  }
}
