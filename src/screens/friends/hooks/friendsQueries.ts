import {
  getGetFriendsQueryKey,
  getGetFriendsSuspenseQueryOptions,
  getGetReceivedRequestsQueryKey,
  getGetReceivedRequestsSuspenseQueryOptions,
} from '../../../api/query-generated/friend';
import type { AuthScope } from '../../../stores/authSessionStore';

export const authQueryPrefix = (scope: AuthScope) =>
  ['auth', scope.sessionId, scope.userId] as const;

export const friendsQueryOptions = (scope: AuthScope) =>
  getGetFriendsSuspenseQueryOptions({
    query: { queryKey: [...authQueryPrefix(scope), ...getGetFriendsQueryKey()] },
  });

export const receivedRequestsQueryOptions = (scope: AuthScope) =>
  getGetReceivedRequestsSuspenseQueryOptions({
    query: { queryKey: [...authQueryPrefix(scope), ...getGetReceivedRequestsQueryKey()] },
  });
