import { AxiosError, CanceledError } from 'axios';
import type { ErrorEvent } from '@sentry/react-native';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { normalizeError } from '../api/errors/normalizeError';
import { logError } from '../api/errors/logger';

const sentry = vi.hoisted(() => ({
  init: vi.fn((options: { beforeSend: (event: ErrorEvent) => ErrorEvent }) => {
    sentry.beforeSend = options.beforeSend;
  }),
  beforeSend: undefined as ((event: ErrorEvent) => ErrorEvent) | undefined,
  setTag: vi.fn(),
  setContext: vi.fn(),
  captureException: vi.fn(),
}));

vi.mock('@sentry/react-native', () => ({
  ...sentry,
  withScope: (callback: (scope: typeof sentry) => void) => callback(sentry),
}));
vi.mock('../config/env', () => ({
  env: {
    appEnv: 'production',
    sentryDsn: 'https://public@example.com/1',
    appVersion: 'test',
    buildChannel: 'production',
  },
}));

beforeEach(() => {
  vi.clearAllMocks();
});

describe('운영 오류 관측의 수집과 중복 방지', () => {
  it('HTTP breadcrumb와 요청 URL의 초대 코드를 지우고 다른 endpoint는 유지한다', () => {
    logError(normalizeError(new Error('서버 오류')), { scope: 'api' });
    const event = sentry.beforeSend!({
      type: undefined,
      request: { url: 'https://api-dev.detoxmate.co.kr/friends/invite/private-code?secret=value' },
      breadcrumbs: [
        {
          category: 'xhr',
          data: { url: 'https://api-dev.detoxmate.co.kr/friends/invite/private-code' },
        },
        { category: 'xhr', data: { url: '/friends/invite' } },
        { category: 'xhr', data: { url: '/friends/requests/received' } },
      ],
    });

    expect(event.request?.url).toBe('https://api-dev.detoxmate.co.kr/friends/invite/[Filtered]');
    expect(event.breadcrumbs?.map((breadcrumb) => breadcrumb.data?.url)).toEqual([
      'https://api-dev.detoxmate.co.kr/friends/invite/[Filtered]',
      '/friends/invite',
      '/friends/requests/received',
    ]);
  });

  it.each([500, undefined])('API 실패가 %s이면 서버 또는 예상 밖 오류를 수집한다', (status) => {
    const failure = normalizeError({
      isAxiosError: true,
      message: 'Request failed',
      response: status ? { status, data: {} } : undefined,
    });

    logError(failure, { scope: 'api' });

    expect(sentry.captureException).toHaveBeenCalledOnce();
  });

  it('같은 API 실패가 경계나 다른 정규화 객체로 전달되면 한 번만 기록하고 새 실패는 기록한다', () => {
    const original = new AxiosError('Request failed');
    const failure = normalizeError(original);

    logError(failure, { scope: 'api' });
    logError(failure, { scope: 'render', componentStack: 'FriendsData' });
    logError(normalizeError(original), { scope: 'render' });
    expect(sentry.captureException).toHaveBeenCalledOnce();

    logError(normalizeError(new AxiosError('Request failed')), { scope: 'api' });
    expect(sentry.captureException).toHaveBeenCalledTimes(2);
  });

  it('다른 계층에서 제외된 AppError가 경계에 도달하면 실제로 기록한다', () => {
    const failure = normalizeError(new AxiosError('Network Error', 'ERR_NETWORK'));

    logError(failure, { scope: 'api' });
    expect(sentry.captureException).not.toHaveBeenCalled();

    logError(failure, { scope: 'render', componentStack: 'FriendsData' });
    expect(sentry.captureException).toHaveBeenCalledOnce();
    // 전송 객체를 넘기지 않고 기존 AppError 표현으로 수집한다.
    expect(sentry.captureException.mock.calls[0][0]).not.toBe(failure.originalError);
  });

  it('예상 가능한 400·404·409 오류는 API와 경계에서 제외한다', () => {
    for (const status of [400, 404, 409]) {
      const failure = normalizeError({
        isAxiosError: true,
        message: 'Expected request failure',
        response: { status, data: {} },
      });

      logError(failure, { scope: 'api' });
      logError(failure, { scope: 'render' });
    }

    expect(sentry.captureException).not.toHaveBeenCalled();
  });

  it('정규화된 취소 오류는 API·경계·항상 수집하는 scope에서도 제외한다', () => {
    const failure = normalizeError(new CanceledError('Request canceled'));

    for (const scope of ['api', 'render', 'auth.refresh']) {
      logError(failure, { scope });
    }

    expect(sentry.captureException).not.toHaveBeenCalled();
  });
});
