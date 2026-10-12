import { QueryObserver } from '@tanstack/react-query';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { getItemAsync, deleteItemAsync } from 'expo-secure-store';

import { queryClient } from '../lib/query/queryClient';
import apiClient from './client';
import { clearAuthSession, getAuthStatus, loginWithTestUser, logout } from './auth';
import { getGetFriendsQueryOptions } from './query-generated/friend';

const mocks = vi.hoisted(() => ({
  friends: vi.fn(),
}));

vi.mock('@react-native-seoul/kakao-login');
vi.mock('expo-apple-authentication');
vi.mock('expo-secure-store');
vi.mock('./client');
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

beforeEach(async () => {
  queryClient.clear();
  await clearAuthSession();
  vi.resetAllMocks();
  vi.mocked(apiClient.post).mockResolvedValue({});
  mocks.friends.mockResolvedValue(aFriends);
});

afterEach(() => {
  queryClient.clear();
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
    vi.mocked(getItemAsync).mockReturnValueOnce(credentials.promise);
    const signingOut = logout();
    await loginWithTestUser('B');

    credentials.resolve('fixture-refresh-B');
    await signingOut;

    expect(vi.mocked(apiClient.post)).not.toHaveBeenCalled();
    expect(await getItemAsync('accessTokenKey')).toBe('fixture-B');
  });

  it('서버 로그아웃 응답이 늦게 돌아와도 다시 로그인한 계정과 캐시를 지우지 않는다', async () => {
    await loginWithTestUser('A');
    const loggingOut = Promise.withResolvers<unknown>();
    const started = Promise.withResolvers<void>();
    vi.mocked(apiClient.post).mockImplementationOnce(() => {
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

    expect(await getItemAsync('accessTokenKey')).toBe('fixture-B');
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
    vi.mocked(apiClient.post).mockRejectedValueOnce(new Error('서버 로그아웃 실패'));

    await logout();

    expect(queryClient.getQueryData(options.queryKey)).toBeUndefined();
    expect(await getItemAsync('accessTokenKey')).toBeNull();
  });

  it.each(['조회', '삭제'])(
    '기기 토큰 %s가 실패해도 이전 계정의 캐시는 먼저 비운다',
    async (operation) => {
      await loginWithTestUser('A');
      const options = getGetFriendsQueryOptions();
      await queryClient.fetchQuery(options);
      if (operation === '조회') {
        vi.mocked(getItemAsync).mockRejectedValueOnce(new Error('기기 토큰 조회 실패'));
        await logout();
      } else {
        vi.mocked(deleteItemAsync).mockRejectedValueOnce(new Error('기기 토큰 삭제 실패'));
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
      vi.mocked(deleteItemAsync).mockImplementationOnce(() => {
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

describe('인증 상태와 화면 접근 차단', () => {
  it('토큰 삭제가 지연되어도 세션 종료 즉시 화면 접근을 차단한다', async () => {
    await loginWithTestUser('A');
    expect(getAuthStatus()).toBe('signedIn');
    const deletion = Promise.withResolvers<void>();
    vi.mocked(deleteItemAsync).mockReturnValueOnce(deletion.promise);
    const clearing = clearAuthSession();
    expect(getAuthStatus()).toBe('signedOut');
    deletion.resolve();
    await clearing;
  });

  it('앱 시작 시 읽은 이전 토큰이 늦게 돌아와도 종료된 세션을 복구하지 않는다', async () => {
    vi.resetModules();
    const freshAuth = await import('./auth');
    const storedToken = Promise.withResolvers<string>();
    vi.mocked(getItemAsync).mockReturnValueOnce(storedToken.promise);
    const restoring = freshAuth.restoreAuthSession();
    await freshAuth.clearAuthSession();
    storedToken.resolve('fixture-old-token');
    await restoring;
    expect(freshAuth.getAuthStatus()).toBe('signedOut');
  });
});

it('탈퇴 정리 중 다시 로그인해도 늦은 토큰 삭제가 새 계정을 지우지 않는다', async () => {
  await loginWithTestUser('A');
  const deletion = Promise.withResolvers<void>();
  const removeStoredValue = vi.mocked(deleteItemAsync).getMockImplementation()!;
  vi.mocked(deleteItemAsync).mockImplementationOnce((key, options) =>
    deletion.promise.then(() => removeStoredValue(key, options))
  );
  const clearing = clearAuthSession();
  const signingIn = loginWithTestUser('B');
  expect(getAuthStatus()).toBe('signedOut');
  deletion.resolve();
  await Promise.all([clearing, signingIn]);
  expect(await getItemAsync('refreshTokenKey')).toBe('fixture-refresh-B');
  expect(await getItemAsync('accessTokenKey')).toBe('fixture-B');
  expect(getAuthStatus()).toBe('signedIn');
});
