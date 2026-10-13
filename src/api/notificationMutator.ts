import type { AxiosRequestConfig } from 'axios';

import type { AppError } from './errors/types';
import { customAxios } from './mutator';

// The screen's boundary and navigation handler own error reporting and recovery.
export const notificationAxios = <T>(config: AxiosRequestConfig): Promise<T> =>
  customAxios<T>({
    ...config,
    timeout: 15_000,
    errorPolicy: { presentation: 'inline', log: false },
  });

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export type ErrorType<_Error> = AppError;
