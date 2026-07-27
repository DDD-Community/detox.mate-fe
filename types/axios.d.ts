import 'axios';
import type { RequestErrorPolicy, RetryPolicy } from '../src/api/errors';

declare module 'axios' {
  export interface AxiosRequestConfig {
    skipAuth?: boolean;
    skipAuthRefresh?: boolean;
    _retry?: boolean;
    errorPolicy?: RequestErrorPolicy;
    skipGlobalError?: boolean;
    retryPolicy?: RetryPolicy;
  }
}
