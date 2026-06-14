import { env } from '../../config/env';
import { captureObservedError } from '../../observability/sentry';
import type { AppError } from './types';

export type ErrorLogContext = {
  scope?: string;
  operation?: string;
  path?: string;
  method?: string;
  status?: number;
  code?: string;
  [key: string]: unknown;
};

export const sanitizeErrorLogContext = (error: AppError, context?: ErrorLogContext) => ({
  ...context,
  type: error.type,
  status: context?.status ?? error.status,
  code: context?.code ?? error.code,
  message: error.message,
});

export function logError(error: AppError, context?: ErrorLogContext) {
  captureObservedError(error, context);

  if (env.appEnv !== 'development') return;

  const payload = sanitizeErrorLogContext(error, context);
  if (error.type === 'server' || error.type === 'unknown') {
    console.error('[AppError]', payload);
    return;
  }

  console.warn('[AppError]', payload);
}
