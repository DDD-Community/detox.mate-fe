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

describe('authentication session storage', () => {
  it('finishes a native write already in flight before persisting the next login', async () => {
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

  it('does not rotate another session token returned by a delayed native read', async () => {
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
    // Wait until the new login has invalidated the old scope before the native read returns.
    await vi.waitFor(() => expect(useAuthSessionStore.getState().scope).toBeNull());
    heldRead.resolve('new-refresh');
    await oldRefresh;
    await loggingIn;
    expect(mocks.post).not.toHaveBeenCalled();
    expect(storage.get('refreshTokenKey')).toBe('new-refresh');
  });
});
