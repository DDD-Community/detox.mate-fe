import type { AxiosRequestConfig } from 'axios';

import { customAxios } from './mutator';

// Friend screens own retry and error feedback; retain the shared authentication flow.
export const friendAxios = <T>(config: AxiosRequestConfig): Promise<T> =>
  customAxios<T>({
    ...config,
    timeout: config.timeout ?? 15_000,
    errorPolicy: { ...config.errorPolicy, presentation: 'inline' },
    retryPolicy: 'none',
    skipGlobalError: true,
  });
