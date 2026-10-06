import { beforeEach, describe, expect, it, vi } from 'vitest';

import { changeAuthQueryScope, getAuthQueryScope } from '../lib/query/authQueryScope';
import { refreshAccessToken } from './auth';

const mocks = vi.hoisted(() => ({ read: vi.fn(), write: vi.fn(), remove: vi.fn(), post: vi.fn() }));
vi.mock('@react-native-seoul/kakao-login', () => ({ login: vi.fn() }));
vi.mock('expo-apple-authentication', () => ({}));
vi.mock('expo-secure-store', () => ({
  getItemAsync: mocks.read,
  setItemAsync: mocks.write,
  deleteItemAsync: mocks.remove,
}));
vi.mock('./client', () => ({ default: { post: mocks.post } }));
vi.mock('./errors', async () => {
  const { AppError, normalizeError } = await import('./errors/normalizeError');
  return { AppError, normalizeError };
});

beforeEach(() => {
  vi.resetAllMocks();
  mocks.read.mockResolvedValue('fictional-refresh-credential');
  changeAuthQueryScope('first-user');
});

describe('토큰 갱신과 계정 변경의 경합', () => {
  it.each(['성공', '실패'] as const)(
    '이전 계정 갱신이 %s해도 새 계정 인증 값을 덮거나 삭제하지 않는다',
    async (outcome) => {
      const reply = Promise.withResolvers<{
        data: { accessToken: string; refreshToken: string };
      }>();
      const started = Promise.withResolvers<void>();
      mocks.post.mockImplementation(() => {
        started.resolve();
        return reply.promise;
      });
      const refreshing = refreshAccessToken();
      const rejected = expect(refreshing).rejects.toMatchObject({ code: 'ERR_CANCELED' });
      await started.promise;
      changeAuthQueryScope('second-user');
      const current = getAuthQueryScope();
      if (outcome === '성공')
        reply.resolve({ data: { accessToken: 'old-access', refreshToken: 'old-refresh' } });
      else reply.reject(new Error('offline'));
      await rejected;
      expect(mocks.write).not.toHaveBeenCalled();
      expect(mocks.remove).not.toHaveBeenCalled();
      expect(getAuthQueryScope()).toEqual(current);
    }
  );
});
