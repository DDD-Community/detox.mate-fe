import { env } from '../../config/env';
import type { AppError } from './types';

type ErrorLogContext = {
  scope?: string;
  operation?: string;
  path?: string;
  method?: string;
  status?: number;
  code?: string;
  [key: string]: unknown;
};

const sanitizeContext = (error: AppError, context?: ErrorLogContext) => ({
  ...context,
  type: error.type,
  status: context?.status ?? error.status,
  code: context?.code ?? error.code,
  message: error.message,
});

export function logError(error: AppError, context?: ErrorLogContext) {
  if (env.appEnv !== 'development') return;

  const payload = sanitizeContext(error, context);
  if (error.type === 'server' || error.type === 'unknown') {
    console.error('[AppError]', payload);
    return;
  }

  console.warn('[AppError]', payload);
}
