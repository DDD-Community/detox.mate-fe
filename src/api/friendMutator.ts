import type { AppError } from './errors/types';
import type { AxiosRequestConfig } from 'axios';

import { getAuthQueryScope, isCurrentAuthQueryScope } from '../lib/query/authQueryScope';
import { customAxios } from './mutator';

// Friend screens own retry and error feedback; retain the shared authentication flow.
export const friendAxios = <T>(config: AxiosRequestConfig): Promise<T> => {
  const scope = getAuthQueryScope();
  return customAxios<T>({
    authScopeIsCurrent: () => isCurrentAuthQueryScope(scope),
    ...config,
    timeout: config.timeout ?? 15_000,
    errorPolicy: {
      ...config.errorPolicy,
      presentation: 'inline',
      ...(config.url === '/friends/search' ? { log: false } : {}),
    },
  });
};

// Orval expects a generic ErrorType even though this mutator normalizes every error.
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export type ErrorType<_Error> = AppError;
