import { useIsMutating, useQueryClient, type Query } from '@tanstack/react-query';
import { CanceledError, isCancel } from 'axios';
import { useEffect, useRef } from 'react';

import { getUserErrorMessage } from '../../../api/errors/messages';
import { normalizeError } from '../../../api/errors/normalizeError';
import { logError } from '../../../api/errors/logger';
import {
  sendRequest,
  useSendRequest,
  type SendRequestMutationError,
} from '../../../api/query-generated/friend';
import {
  FriendSearchResponseRelationshipStatus as RelationshipStatus,
  type FriendSearchResponse,
} from '../../../api/query-generated/model';
import { isCurrentAuthQueryScope, useAuthQueryScope } from '../../../lib/query/authQueryScope';
import { trackEvent } from '../../../lib/analytics';
import { searchQueryOptions } from '../utils/friendsQueryOptions';
import { requireId } from '../utils/friendsListData';

export function useSendFriendRequest(email: string, user: FriendSearchResponse) {
  const scope = useAuthQueryScope();
  const client = useQueryClient();
  const options = searchQueryOptions(email, scope);
  const mutationKey = ['friends-send', scope, user.userId];
  const pending = useIsMutating({ mutationKey, exact: true }) > 0;
  const mounted = useRef(true);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);
  const ownsResult = (query: Query | undefined) =>
    query !== undefined &&
    isCurrentAuthQueryScope(scope) &&
    client.getQueryCache().find({ queryKey: options.queryKey, exact: true }) === query;
  const mutation = useSendRequest<SendRequestMutationError, Query | undefined>({
    mutation: {
      mutationKey,
      onMutate: () => client.getQueryCache().find({ queryKey: options.queryKey, exact: true }),
      // onMutate를 기다리는 동안 세션이 바뀔 수 있어 HTTP 실행 직전에 확인한다.
      mutationFn: ({ data }) => {
        if (!isCurrentAuthQueryScope(scope))
          throw new CanceledError('The authentication session changed.');
        return sendRequest({ ...data, targetUserId: requireId(data.targetUserId) });
      },
      onSuccess: async (response, _variables, query) => {
        if (!ownsResult(query)) return;
        await client.cancelQueries({ queryKey: options.queryKey, exact: true });
        if (!ownsResult(query)) return;
        client.setQueryData<FriendSearchResponse>(options.queryKey, (previous) => ({
          ...previous,
          ...response.user,
          relationshipStatus: RelationshipStatus.PENDING_SENT,
          requestId: response.requestId,
        }));
        try {
          trackEvent('Friend Request Sent');
        } catch (failure) {
          logError(normalizeError(failure), { scope: 'api', operation: 'logFriendRequestSent' });
        }
        // 확정 결과는 유지하고 다음 진입에서 서버와 다시 맞춘다.
        void client.invalidateQueries({
          queryKey: options.queryKey,
          exact: true,
          refetchType: 'none',
        });
      },
      onError: (failure, _variables, query) => {
        if (isCancel(failure) || !ownsResult(query)) return;
        const appError = normalizeError(failure);
        logError(appError, { scope: 'api', operation: 'sendFriendRequest' });
        if (appError.status === 409) {
          void client.invalidateQueries({ queryKey: options.queryKey, exact: true });
        }
      },
    },
  });
  const { isError, reset } = mutation;
  useEffect(() => {
    if (
      isError &&
      user.relationshipStatus !== RelationshipStatus.NONE &&
      user.relationshipStatus !== RelationshipStatus.SELF
    )
      reset();
  }, [isError, reset, user.relationshipStatus]);
  const send = async () => {
    if (
      !mounted.current ||
      client.isMutating({ mutationKey, exact: true }) ||
      !isCurrentAuthQueryScope(scope)
    )
      return;
    const currentUser = client.getQueryData(options.queryKey);
    if (
      currentUser?.userId !== user.userId ||
      (currentUser?.relationshipStatus !== RelationshipStatus.NONE &&
        currentUser?.relationshipStatus !== RelationshipStatus.SELF)
    )
      return;
    try {
      await mutation.mutateAsync({ data: { targetUserId: user.userId! } });
    } catch {
      // 기록은 onError, 안내는 mutation.error가 맡는다.
      return;
    }
  };
  const error =
    mutation.error &&
    !isCancel(mutation.error) &&
    ownsResult(mutation.context) &&
    (user.relationshipStatus === RelationshipStatus.NONE ||
      user.relationshipStatus === RelationshipStatus.SELF)
      ? getUserErrorMessage(normalizeError(mutation.error))
      : null;
  return { send, pending, error };
}
