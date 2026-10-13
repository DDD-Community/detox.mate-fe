import { afterEach, describe, expect, it, vi } from 'vitest';

import { logError } from './logger';
import { AppError } from './normalizeError';

const capture = vi.hoisted(() => vi.fn());
vi.mock('../../observability/sentry', () => ({ captureObservedError: capture }));
vi.mock('../../config/env', () => ({ env: { appEnv: 'development' } }));

afterEach(() => {
  vi.restoreAllMocks();
  capture.mockClear();
});

describe('친구 초대 오류 기록의 개인정보 보호', () => {
  it('초대 조회가 실패하면 고정 초대 코드를 콘솔과 운영 관측에 남기지 않는다', () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const error = AppError({ type: 'server', status: 500 });
    logError(error, { scope: 'api', method: 'GET', path: '/friends/invite/private-code' });

    const expected = expect.objectContaining({
      scope: 'api',
      method: 'GET',
      path: '/friends/invite/[Filtered]',
    });
    expect(capture).toHaveBeenCalledWith(error, expected);
    expect(consoleError).toHaveBeenCalledWith('[AppError]', expected);
  });
});
