import { env } from '../../config/env';
import { captureObservedError } from '../../observability/sentry';
import { redactFriendInviteCode } from '../../observability/redactFriendInviteCode';
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
  ...(context?.path
    ? {
        path: redactFriendInviteCode(context.path),
      }
    : {}),
  type: error.type,
  status: context?.status ?? error.status,
  code: context?.code ?? error.code,
  message: error.message,
});

export function logError(error: AppError, context?: ErrorLogContext) {
  const payload = sanitizeErrorLogContext(error, context);
  captureObservedError(error, payload);

  if (env.appEnv !== 'development') return;

  if (error.type === 'server' || error.type === 'unknown') {
    console.error('[AppError]', payload);
    return;
  }

  console.warn('[AppError]', payload);
}
