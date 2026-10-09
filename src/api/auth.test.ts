import { QueryObserver } from '@tanstack/react-query';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { queryClient } from '../lib/query/queryClient';
import { loginWithTestUser, logout } from './auth';
import { getGetFriendsQueryOptions } from './query-generated/friend';

const mocks = vi.hoisted(() => ({
  storage: new Map<string, string>(),
  getItemAsync: vi.fn(),
  deleteItemAsync: vi.fn(),
  post: vi.fn(),
  friends: vi.fn(),
  requests: new AbortController(),
}));

vi.mock('@react-native-seoul/kakao-login', () => ({ login: vi.fn() }));
vi.mock('expo-apple-authentication', () => ({}));
vi.mock('expo-secure-store', () => ({
  getItemAsync: mocks.getItemAsync,
  deleteItemAsync: mocks.deleteItemAsync,
  setItemAsync: async (key: string, value: string) => {
    mocks.storage.set(key, value);
  },
}));
vi.mock('./client', () => ({
  default: { post: mocks.post },
  getAuthenticatedRequestSignal: () => mocks.requests.signal,
  cancelAuthenticatedRequests: () => mocks.requests.abort(),
  resumeAuthenticatedRequests: () => {
    mocks.requests = new AbortController();
  },
}));
vi.mock('./errors', async () => import('./errors/normalizeError'));
vi.mock('./friendMutator', () => ({ friendAxios: mocks.friends }));
vi.mock('./generated/dev-auth/dev-auth', () => ({
  getDevAuth: () => ({
    testLogin: async ({ testUserKey }: { testUserKey: string }) => ({
      id: testUserKey === 'A' ? 101 : 202,
      accessToken: `fixture-${testUserKey}`,
      refreshToken: `fixture-refresh-${testUserKey}`,
    }),
  }),
}));

const aFriends = [{ friendshipId: 41, user: { userId: 8, displayName: '이전 계정 친구' } }];

beforeEach(() => {
  queryClient.clear();
  mocks.storage.clear();
  vi.resetAllMocks();
  mocks.getItemAsync.mockImplementation(async (key: string) => mocks.storage.get(key) ?? null);
  mocks.deleteItemAsync.mockImplementation(async (key: string) => {
    mocks.storage.delete(key);
  });
  mocks.post.mockResolvedValue({});
  mocks.friends.mockResolvedValue(aFriends);
});

afterEach(() => {
  queryClient.clear();
  mocks.storage.clear();
});

describe('로그아웃 후 이전 계정의 서버 상태 격리', () => {
  it('다른 계정으로 로그인한 뒤 조회가 실패해도 이전 친구와 mutation 결과가 남지 않는다', async () => {
    await loginWithTestUser('A');
    const options = getGetFriendsQueryOptions();
    await queryClient.fetchQuery(options);
    await queryClient
      .getMutationCache()
      .build(queryClient, { mutationFn: async () => aFriends })
      .execute(undefined);

    await logout();
    await loginWithTestUser('B');
    mocks.friends.mockRejectedValue(new Error('새 계정 조회 실패'));
    await expect(queryClient.fetchQuery(options)).rejects.toThrow('새 계정 조회 실패');

    const observer = new QueryObserver(queryClient, options);
    expect(observer.getCurrentResult().data).toBeUndefined();
    expect(queryClient.getMutationCache().getAll()).toHaveLength(0);
  });

  it('로그아웃의 토큰 조회가 늦게 끝나도 새로 로그인한 토큰을 서버에 보내지 않는다', async () => {
    await loginWithTestUser('A');
    const credentials = Promise.withResolvers<string>();
    mocks.getItemAsync.mockReturnValueOnce(credentials.promise);
    const signingOut = logout();
    await loginWithTestUser('B');

    credentials.resolve('fixture-refresh-B');
    await signingOut;

    expect(mocks.post).not.toHaveBeenCalled();
    expect(mocks.storage.get('accessTokenKey')).toBe('fixture-B');
  });

  it('서버 로그아웃 응답이 늦게 돌아와도 다시 로그인한 계정과 캐시를 지우지 않는다', async () => {
    await loginWithTestUser('A');
    const loggingOut = Promise.withResolvers<unknown>();
    const started = Promise.withResolvers<void>();
    mocks.post.mockImplementationOnce(() => {
      started.resolve();
      return loggingOut.promise;
    });
    const signingOut = logout();
    await started.promise;
    await loginWithTestUser('B');
    const options = getGetFriendsQueryOptions();
    const bFriends = [{ friendshipId: 42, user: { userId: 9, displayName: '현재 계정 친구' } }];
    mocks.friends.mockResolvedValueOnce(bFriends);
    await queryClient.fetchQuery(options);

    loggingOut.resolve({});
    await signingOut;

    expect(mocks.storage.get('accessTokenKey')).toBe('fixture-B');
    expect(queryClient.getQueryData(options.queryKey)).toEqual(bFriends);
  });

  it('로그아웃 전에 시작한 친구 조회가 늦게 끝나도 이전 데이터를 캐시에 복원하지 않는다', async () => {
    await loginWithTestUser('A');
    const oldRead = Promise.withResolvers<typeof aFriends>();
    mocks.friends.mockReturnValueOnce(oldRead.promise);
    const options = getGetFriendsQueryOptions();
    const reading = queryClient.fetchQuery(options).catch(() => undefined);

    await logout();
    await loginWithTestUser('B');
    oldRead.resolve(aFriends);
    await reading;

    expect(queryClient.getQueryData(options.queryKey)).toBeUndefined();
  });

  it('서버 로그아웃이 실패해도 이전 계정의 캐시를 비운다', async () => {
    await loginWithTestUser('A');
    const options = getGetFriendsQueryOptions();
    await queryClient.fetchQuery(options);
    mocks.post.mockRejectedValueOnce(new Error('서버 로그아웃 실패'));

    await logout();

    expect(queryClient.getQueryData(options.queryKey)).toBeUndefined();
    expect(mocks.storage.has('accessTokenKey')).toBe(false);
  });

  it.each(['조회', '삭제'])(
    '기기 토큰 %s가 실패해도 이전 계정의 캐시는 먼저 비운다',
    async (operation) => {
      await loginWithTestUser('A');
      const options = getGetFriendsQueryOptions();
      await queryClient.fetchQuery(options);
      if (operation === '조회') {
        mocks.getItemAsync.mockRejectedValueOnce(new Error('기기 토큰 조회 실패'));
        await logout();
      } else {
        mocks.deleteItemAsync.mockRejectedValueOnce(new Error('기기 토큰 삭제 실패'));
        await expect(logout()).rejects.toThrow('기기 토큰 삭제 실패');
      }

      expect(queryClient.getQueryData(options.queryKey)).toBeUndefined();
    }
  );

  it.each(['완료', '실패'])(
    '토큰 삭제가 %s될 때 정리 도중 다시 시작된 조회도 남기지 않는다',
    async (outcome) => {
      await loginWithTestUser('A');
      const options = getGetFriendsQueryOptions();
      await queryClient.fetchQuery(options);
      const deleting = Promise.withResolvers<void>();
      const deletionStarted = Promise.withResolvers<void>();
      mocks.deleteItemAsync.mockImplementationOnce(() => {
        deletionStarted.resolve();
        return deleting.promise;
      });

      const signingOut = logout().catch(() => undefined);
      await deletionStarted.promise;
      expect(queryClient.getQueryData(options.queryKey)).toBeUndefined();
      // 이전 토큰 삭제가 보류된 사이 재시작된 조회는 이전 데이터를 다시 담을 수 있다.
      await queryClient.fetchQuery(options);
      if (outcome === '완료') deleting.resolve();
      else deleting.reject(new Error('기기 토큰 삭제 실패'));
      await signingOut;

      expect(queryClient.getQueryData(options.queryKey)).toBeUndefined();
    }
  );
});
