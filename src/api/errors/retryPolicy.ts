import type { AxiosRequestConfig } from 'axios';

import type { AppError, RetryPolicy } from './types';

const SAFE_METHODS = new Set(['get', 'head']);

export function getRequestRetryPolicy(config?: AxiosRequestConfig): RetryPolicy {
  return config?.retryPolicy ?? config?.errorPolicy?.retryPolicy ?? 'safeMethods';
}

export function canRetryRequest(config: AxiosRequestConfig | undefined, error: AppError): boolean {
  if (!config || !error.retriable) return false;

  const retryPolicy = getRequestRetryPolicy(config);
  if (retryPolicy === 'none') return false;
  if (retryPolicy === 'manual') return true;

  const method = (config.method ?? 'get').toLowerCase();
  return SAFE_METHODS.has(method);
}
