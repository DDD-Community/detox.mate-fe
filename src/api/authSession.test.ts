import { beforeEach, describe, expect, it, vi } from 'vitest';

import { loginWithTestUser, refreshAccessToken } from './auth';
import {
  beginAuthTransition,
  completeAuthTransition,
  useAuthSessionStore,
} from '../stores/authSessionStore';

const mocks = vi.hoisted(() => ({
  getItemAsync: vi.fn(),
  setItemAsync: vi.fn(),
  deleteItemAsync: vi.fn(),
  post: vi.fn(),
  testLogin: vi.fn(),
}));
vi.mock('expo-secure-store', () => mocks);
vi.mock('@react-native-seoul/kakao-login', () => ({ login: vi.fn() }));
vi.mock('expo-apple-authentication', () => ({}));
vi.mock('./client', () => ({ default: { post: mocks.post } }));
vi.mock('./generated/dev-auth/dev-auth', () => ({
  getDevAuth: () => ({ testLogin: mocks.testLogin }),
}));
vi.mock('../observability/sentry', () => ({ captureObservedError: vi.fn() }));
vi.mock('../config/env', () => ({ env: { appEnv: 'production' } }));

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((res) => {
    resolve = res;
  });
  return { promise, resolve };
}
const storage = new Map<string, string>();
beforeEach(() => {
  vi.resetAllMocks();
  storage.clear();
  storage.set('accessTokenKey', 'old-access');
  storage.set('refreshTokenKey', 'old-refresh');
  storage.set('currentUserId', '1');
  completeAuthTransition(beginAuthTransition(), 1);
  mocks.getItemAsync.mockImplementation(async (key) => storage.get(key) ?? null);
  mocks.setItemAsync.mockImplementation(async (key, value) => {
    storage.set(key, value);
  });
  mocks.deleteItemAsync.mockImplementation(async (key) => {
    storage.delete(key);
  });
  mocks.post.mockResolvedValue({
    data: { accessToken: 'old-refreshed-access', refreshToken: 'old-refreshed-refresh' },
  });
  mocks.testLogin.mockResolvedValue({
    id: 2,
    accessToken: 'new-access',
    refreshToken: 'new-refresh',
  });
});

describe('인증 세션 저장소', () => {
  it('이전 토큰의 네이티브 저장이 진행 중이면 완료를 기다린 뒤 새 로그인 정보를 저장한다', async () => {
    const started = deferred<void>();
    const heldWrite = deferred<void>();
    mocks.setItemAsync.mockImplementation(async (key, value) => {
      if (value === 'old-refreshed-access') {
        started.resolve();
        await heldWrite.promise;
      }
      storage.set(key, value);
    });
    const oldRefresh = expect(refreshAccessToken()).rejects.toMatchObject({ type: 'auth' });
    await started.promise;
    const loggingIn = loginWithTestUser('fixture');
    await vi.waitFor(() => expect(useAuthSessionStore.getState().scope).toBeNull());
    heldWrite.resolve();
    await oldRefresh;
    await loggingIn;
    expect(storage.get('accessTokenKey')).toBe('new-access');
    expect(storage.get('refreshTokenKey')).toBe('new-refresh');
    expect(storage.get('currentUserId')).toBe('2');
  });

  it('이전 세션의 네이티브 조회가 새 세션의 토큰을 반환해도 해당 토큰으로 갱신하지 않는다', async () => {
    const started = deferred<void>();
    const heldRead = deferred<string>();
    mocks.getItemAsync.mockImplementation(async (key) => {
      if (key === 'refreshTokenKey') {
        started.resolve();
        return heldRead.promise;
      }
      return storage.get(key) ?? null;
    });
    const oldRefresh = expect(refreshAccessToken()).rejects.toMatchObject({ type: 'auth' });
    await started.promise;
    const loggingIn = loginWithTestUser('fixture');
    // 네이티브 조회를 완료하기 전에 새 로그인으로 이전 세션 범위가 무효화될 때까지 기다린다.
    await vi.waitFor(() => expect(useAuthSessionStore.getState().scope).toBeNull());
    heldRead.resolve('new-refresh');
    await oldRefresh;
    await loggingIn;
    expect(mocks.post).not.toHaveBeenCalled();
    expect(storage.get('refreshTokenKey')).toBe('new-refresh');
  });
});
