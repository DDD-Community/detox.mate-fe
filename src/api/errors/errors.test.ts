import type { AxiosRequestConfig } from 'axios';
import { describe, expect, it } from 'vitest';

import { handleRequestError } from './handleRequestError';
import { getUserErrorMessage } from './messages';
import { AppError, normalizeError } from './normalizeError';
import { canRetryRequest, getRequestRetryPolicy } from './retryPolicy';

const createAxiosError = ({
  status,
  data,
  code,
  message = 'Request failed',
}: {
  status?: number;
  data?: unknown;
  code?: string;
  message?: string;
}) => ({
  isAxiosError: true,
  message,
  code,
  response: status ? { status, data } : undefined,
});

describe('normalizeError', () => {
  it('normalizes API error payloads from Axios responses', () => {
    const error = normalizeError(
      createAxiosError({
        status: 403,
        data: { code: 'FORBIDDEN', message: 'Forbidden', status: 403 },
      })
    );

    expect(error.type).toBe('forbidden');
    expect(error.status).toBe(403);
    expect(error.code).toBe('FORBIDDEN');
    expect(error.payload?.message).toBe('Forbidden');
  });

  it('normalizes network and timeout errors', () => {
    const networkError = normalizeError(
      createAxiosError({ code: 'ERR_NETWORK', message: 'Network Error' })
    );
    const timeoutError = normalizeError(
      createAxiosError({ code: 'ECONNABORTED', message: 'timeout' })
    );

    expect(networkError.type).toBe('network');
    expect(networkError.retriable).toBe(true);
    expect(timeoutError.type).toBe('timeout');
    expect(timeoutError.retriable).toBe(true);
  });

  it('normalizes upload and unknown errors', () => {
    const uploadError = AppError({ type: 'upload', code: 'UPLOAD_FAILED' });
    const unknownError = normalizeError('unexpected');

    expect(normalizeError(uploadError).type).toBe('upload');
    expect(unknownError.type).toBe('unknown');
  });
});

describe('getUserErrorMessage', () => {
  it('uses code and status maps before default type messages', () => {
    const error = AppError({ type: 'conflict', status: 409, code: 'ALREADY_JOINED' });

    expect(
      getUserErrorMessage(error, {
        messagesByCode: { ALREADY_JOINED: '이미 참여 중이에요.' },
        messagesByStatus: { 409: '요청을 완료할 수 없어요.' },
      })
    ).toBe('이미 참여 중이에요.');
  });

  it('falls back to type messages', () => {
    expect(getUserErrorMessage(AppError({ type: 'server' }))).toBe(
      '요청을 처리하지 못했어요. 잠시 후 다시 시도해주세요'
    );
  });
});

describe('retry policy', () => {
  it('retries only safe methods by default', () => {
    const networkError = AppError({ type: 'network', retriable: true });

    expect(canRetryRequest({ method: 'GET' }, networkError)).toBe(true);
    expect(canRetryRequest({ method: 'HEAD' }, networkError)).toBe(true);
    expect(canRetryRequest({ method: 'POST' }, networkError)).toBe(false);
  });

  it('allows mutation retry only with manual policy', () => {
    const networkError = AppError({ type: 'network', retriable: true });
    const config: AxiosRequestConfig = { method: 'POST', retryPolicy: 'manual' };

    expect(getRequestRetryPolicy(config)).toBe('manual');
    expect(canRetryRequest(config, networkError)).toBe(true);
  });
});

describe('handleRequestError', () => {
  it('uses request presentation policy for inline handling', () => {
    const result = handleRequestError(AppError({ type: 'validation', status: 400 }), {
      presentation: 'inline',
      messagesByStatus: { 400: '입력값을 확인해주세요.' },
    });

    expect(result.presentation).toBe('inline');
    expect(result.message).toBe('입력값을 확인해주세요.');
    expect(result.shouldLog).toBe(false);
  });

  it('defaults server errors to toast handling and logging', () => {
    const result = handleRequestError(AppError({ type: 'server', status: 500 }));

    expect(result.presentation).toBe('toast');
    expect(result.shouldLog).toBe(true);
  });
});
