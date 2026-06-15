import { getUserErrorMessage } from './messages';
import { normalizeError } from './normalizeError';
import type { ErrorPresentation, HandledErrorResult, RequestErrorPolicy } from './types';

const DEFAULT_PRESENTATION_BY_TYPE: Partial<Record<string, ErrorPresentation>> = {
  network: 'toast',
  timeout: 'toast',
  server: 'toast',
};

export function handleRequestError(
  error: unknown,
  policy?: RequestErrorPolicy
): HandledErrorResult {
  const appError = normalizeError(error);
  const presentation =
    policy?.presentation ?? DEFAULT_PRESENTATION_BY_TYPE[appError.type] ?? 'silent';

  return {
    error: appError,
    message: getUserErrorMessage(appError, policy),
    presentation,
    shouldLog: policy?.log ?? (presentation === 'silent' || appError.type === 'server'),
  };
}
