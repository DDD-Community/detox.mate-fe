import { CanceledError } from 'axios';
import type { UseMutationOptions } from '@tanstack/react-query';
import { isCurrentAuthQueryScope } from '../../../lib/query/authQueryScope';

import {
  getGetFriendsSuspenseQueryOptions,
  getGetReceivedRequestsSuspenseQueryOptions,
  getSearchByEmailQueryOptions,
} from '../../../api/query-generated/friend';
import type { AuthQueryScope } from '../../../lib/query/authQueryScope';

const scoped = <T extends { queryKey: readonly unknown[] }>(
  options: T,
  scope?: AuthQueryScope
): T => (scope ? { ...options, queryKey: [...options.queryKey, scope] } : options);

export const friendsQueryOptions = (scope?: AuthQueryScope) =>
  scoped(getGetFriendsSuspenseQueryOptions(), scope);
export const receivedQueryOptions = (scope?: AuthQueryScope) =>
  scoped(getGetReceivedRequestsSuspenseQueryOptions(), scope);
export const searchQueryOptions = (email: string, scope: AuthQueryScope) =>
  scoped(getSearchByEmailQueryOptions({ email }), scope);

export const isScopeSearch = (key: readonly unknown[], scope?: AuthQueryScope) => {
  const candidate = key.at(-1) as AuthQueryScope | undefined;
  return (
    key[0] === '/friends/search' &&
    (!scope || (candidate?.userId === scope.userId && candidate?.version === scope.version))
  );
};

// The generated mutation executes later than the click handler. Validate its captured
// identity immediately before delegating to the unchanged generated HTTP function.
export function guardFriendMutation<TData, TError, TVariables, TContext>(
  options: UseMutationOptions<TData, TError, TVariables, TContext>,
  scope?: AuthQueryScope
): UseMutationOptions<TData, TError, TVariables, TContext> {
  const generated = options.mutationFn;
  if (!generated || !scope) return options;
  return {
    ...options,
    mutationFn: (variables, context) => {
      if (!isCurrentAuthQueryScope(scope))
        throw new CanceledError('The authentication session changed.');
      return generated(variables, context);
    },
  };
}
