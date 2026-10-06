import {
  getGetFriendsQueryKey,
  getGetFriendsSuspenseQueryOptions,
  getGetReceivedRequestsQueryKey,
  getGetReceivedRequestsSuspenseQueryOptions,
  getSearchByEmailQueryKey,
  getSearchByEmailSuspenseQueryOptions,
} from '../../../api/query-generated/friend';
import type { AuthQueryScope } from '../../../lib/query/authQueryScope';

export const friendsQueryOptions = (scope: AuthQueryScope) =>
  getGetFriendsSuspenseQueryOptions({
    query: { queryKey: [...getGetFriendsQueryKey(), scope] },
  });

export const receivedQueryOptions = (scope: AuthQueryScope) =>
  getGetReceivedRequestsSuspenseQueryOptions({
    query: { queryKey: [...getGetReceivedRequestsQueryKey(), scope] },
  });

export const searchQueryOptions = (email: string, scope: AuthQueryScope) =>
  getSearchByEmailSuspenseQueryOptions(
    { email },
    { query: { queryKey: [...getSearchByEmailQueryKey({ email }), scope] } }
  );

export const isScopeSearch = (key: readonly unknown[], scope: AuthQueryScope) => {
  const candidate = key.at(-1) as AuthQueryScope | undefined;
  return (
    key[0] === getSearchByEmailQueryKey()[0] &&
    candidate?.userId === scope.userId &&
    candidate?.version === scope.version
  );
};
