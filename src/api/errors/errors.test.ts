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

describe('normalizeError 오류 정규화', () => {
  it('Axios 응답에 API 오류 정보가 있으면 오류 유형과 서버 정보를 정규화한다', () => {
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

  it('네트워크 또는 시간 초과 오류가 발생하면 재시도 가능한 오류로 정규화한다', () => {
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

  it('업로드 오류는 유형을 유지하고 알 수 없는 오류는 unknown 유형으로 정규화한다', () => {
    const uploadError = AppError({ type: 'upload', code: 'UPLOAD_FAILED' });
    const unknownError = normalizeError('unexpected');

    expect(normalizeError(uploadError).type).toBe('upload');
    expect(unknownError.type).toBe('unknown');
  });
});

describe('getUserErrorMessage 사용자 오류 메시지 선택', () => {
  it('코드와 상태별 메시지가 있으면 기본 유형 메시지보다 코드 메시지를 우선한다', () => {
    const error = AppError({ type: 'conflict', status: 409, code: 'ALREADY_JOINED' });

    expect(
      getUserErrorMessage(error, {
        messagesByCode: { ALREADY_JOINED: '이미 참여 중이에요.' },
        messagesByStatus: { 409: '요청을 완료할 수 없어요.' },
      })
    ).toBe('이미 참여 중이에요.');
  });

  it('별도 메시지 설정이 없으면 오류 유형의 기본 메시지를 반환한다', () => {
    expect(getUserErrorMessage(AppError({ type: 'server' }))).toBe(
      '요청을 처리하지 못했어요. 잠시 후 다시 시도해주세요'
    );
  });
});

describe('요청 재시도 정책', () => {
  it('기본 정책에서는 안전한 GET·HEAD 요청만 재시도하고 POST 요청은 재시도하지 않는다', () => {
    const networkError = AppError({ type: 'network', retriable: true });

    expect(canRetryRequest({ method: 'GET' }, networkError)).toBe(true);
    expect(canRetryRequest({ method: 'HEAD' }, networkError)).toBe(true);
    expect(canRetryRequest({ method: 'POST' }, networkError)).toBe(false);
  });

  it('POST 요청에 manual 정책을 지정하면 재시도를 허용한다', () => {
    const networkError = AppError({ type: 'network', retriable: true });
    const config: AxiosRequestConfig = { method: 'POST', retryPolicy: 'manual' };

    expect(getRequestRetryPolicy(config)).toBe('manual');
    expect(canRetryRequest(config, networkError)).toBe(true);
  });
});

describe('handleRequestError 오류 표시 정책', () => {
  it('inline 표시 정책을 지정하면 해당 메시지를 반환하고 오류를 기록하지 않는다', () => {
    const result = handleRequestError(AppError({ type: 'validation', status: 400 }), {
      presentation: 'inline',
      messagesByStatus: { 400: '입력값을 확인해주세요.' },
    });

    expect(result.presentation).toBe('inline');
    expect(result.message).toBe('입력값을 확인해주세요.');
    expect(result.shouldLog).toBe(false);
  });

  it('서버 오류에 별도 정책이 없으면 toast 표시와 오류 기록을 적용한다', () => {
    const result = handleRequestError(AppError({ type: 'server', status: 500 }));

    expect(result.presentation).toBe('toast');
    expect(result.shouldLog).toBe(true);
  });

  it('화면이 예상 밖 오류를 안내해도 기록하고 명시적인 로그 제외 정책은 유지한다', () => {
    const error = AppError({ type: 'unknown' });

    expect(handleRequestError(error, { presentation: 'inline' }).shouldLog).toBe(true);
    expect(handleRequestError(error, { presentation: 'inline', log: false }).shouldLog).toBe(false);
  });
});
