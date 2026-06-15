import axios, { AxiosError } from 'axios';

import type { ApiErrorPayload, AppError, AppErrorType } from './types';

type AppErrorInput = {
  type: AppErrorType;
  message?: string;
  status?: number;
  code?: string;
  payload?: ApiErrorPayload;
  originalError?: unknown;
  retriable?: boolean;
};

const DEFAULT_ERROR_MESSAGE = '요청을 처리하지 못했어요. 잠시 후 다시 시도해주세요';

export const isAppError = (error: unknown): error is AppError =>
  Boolean(error && typeof error === 'object' && (error as Partial<AppError>).isAppError);

export function AppError({
  type,
  message,
  status,
  code,
  payload,
  originalError,
  retriable,
}: AppErrorInput): AppError {
  const appError = new Error(message ?? DEFAULT_ERROR_MESSAGE) as AppError;
  appError.name = 'AppError';
  appError.isAppError = true;
  appError.type = type;
  appError.status = status;
  appError.code = code;
  appError.payload = payload;
  appError.originalError = originalError;
  appError.retriable = retriable;

  return appError;
}

const toApiErrorPayload = (data: unknown, fallbackStatus?: number): ApiErrorPayload | undefined => {
  if (!data || typeof data !== 'object') {
    return fallbackStatus ? { status: fallbackStatus } : undefined;
  }

  const record = data as Record<string, unknown>;
  const status = typeof record.status === 'number' ? record.status : fallbackStatus;
  const code = typeof record.code === 'string' ? record.code : undefined;
  const message = typeof record.message === 'string' ? record.message : undefined;

  return {
    ...record,
    ...(code ? { code } : {}),
    ...(message ? { message } : {}),
    ...(status ? { status } : {}),
  };
};

const getTypeByStatus = (status?: number): AppErrorType => {
  if (status === 401) return 'auth';
  if (status === 403) return 'forbidden';
  if (status === 404) return 'notFound';
  if (status === 409) return 'conflict';
  if (status === 400 || status === 422) return 'validation';
  if (status != null && status >= 500) return 'server';
  return 'unknown';
};

const isTimeoutAxiosError = (error: AxiosError) =>
  error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT';

const isNetworkAxiosError = (error: AxiosError) =>
  !error.response &&
  (error.code === 'ERR_NETWORK' ||
    error.message === 'Network Error' ||
    error.message.includes('Network request failed'));

const isPermissionError = (message: string) =>
  message.toLowerCase().includes('permission') || message.includes('권한');

const isNetworkLikeError = (message: string) =>
  message === 'Network request failed' ||
  message.includes('Network Error') ||
  message.includes('Failed to fetch');

export function normalizeError(error: unknown): AppError {
  if (isAppError(error)) return error;

  if (axios.isAxiosError(error)) {
    if (!error.response) {
      const type = isTimeoutAxiosError(error) ? 'timeout' : 'network';
      return AppError({
        type: isNetworkAxiosError(error) || type === 'timeout' ? type : 'unknown',
        message: error.message,
        originalError: error,
        retriable: type === 'network' || type === 'timeout',
      });
    }

    const status = error.response.status;
    const payload = toApiErrorPayload(error.response.data, status);

    return AppError({
      type: getTypeByStatus(status),
      status,
      code: payload?.code,
      payload,
      message: payload?.message ?? error.message,
      originalError: error,
      retriable: status >= 500,
    });
  }

  if (error instanceof Error) {
    const type = isPermissionError(error.message)
      ? 'permission'
      : isNetworkLikeError(error.message)
        ? 'network'
        : 'unknown';

    return AppError({
      type,
      message: error.message,
      originalError: error,
      retriable: type === 'network',
    });
  }

  return AppError({
    type: 'unknown',
    message: DEFAULT_ERROR_MESSAGE,
    originalError: error,
  });
}
