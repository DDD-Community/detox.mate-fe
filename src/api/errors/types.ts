export type AppErrorType =
  | 'network'
  | 'timeout'
  | 'auth'
  | 'forbidden'
  | 'notFound'
  | 'conflict'
  | 'validation'
  | 'server'
  | 'upload'
  | 'permission'
  | 'unknown';

export type ApiErrorPayload = {
  code?: string;
  message?: string;
  status?: number;
  [key: string]: unknown;
};

export type ErrorPresentation = 'toast' | 'inline' | 'dialog' | 'silent';

export type RetryPolicy = 'none' | 'safeMethods' | 'manual';

export type RequestErrorPolicy = {
  presentation?: ErrorPresentation;
  userMessage?: string;
  messagesByCode?: Record<string, string>;
  messagesByStatus?: Partial<Record<number, string>>;
  retryPolicy?: RetryPolicy;
  log?: boolean;
  context?: string;
};

export type AppError = Error & {
  isAppError: true;
  type: AppErrorType;
  status?: number;
  code?: string;
  payload?: ApiErrorPayload;
  originalError?: unknown;
  retriable?: boolean;
};

export type HandledErrorResult = {
  error: AppError;
  message: string;
  presentation: ErrorPresentation;
  shouldLog: boolean;
};
