import { AxiosError, type AxiosAdapter, type InternalAxiosRequestConfig } from 'axios';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import apiClient from './client';
import { beginAuthTransition, completeAuthTransition } from '../stores/authSessionStore';
import * as api from './query-generated/friend';

const mocks = vi.hoisted(() => ({
  getItemAsync: vi.fn(),
  refreshAccessToken: vi.fn(),
  clearAuthSession: vi.fn(),
  replace: vi.fn(),
  enqueueNetworkRetryRequest: vi.fn(),
  showMessage: vi.fn(),
}));

vi.mock('expo-secure-store', () => ({ getItemAsync: mocks.getItemAsync }));
vi.mock('expo-router', () => ({ router: { replace: mocks.replace } }));
vi.mock('../config/env', () => ({
  env: { apiBaseUrl: 'https://api-dev.detoxmate.co.kr', appEnv: 'production' },
}));
vi.mock('./auth', () => ({
  refreshAccessToken: mocks.refreshAccessToken,
  clearAuthSession: mocks.clearAuthSession,
}));
vi.mock('../observability/sentry', () => ({ captureObservedError: vi.fn() }));
vi.mock('../stores/networkErrorToastStore', () => ({
  useNetworkErrorToastStore: {
    getState: () => ({
      enqueueNetworkRetryRequest: mocks.enqueueNetworkRetryRequest,
      showMessage: mocks.showMessage,
    }),
  },
}));

const originalAdapter = apiClient.defaults.adapter;
const requests: InternalAxiosRequestConfig[] = [];
const response = (config: InternalAxiosRequestConfig, data: unknown, status = 200) => ({
  config,
  data,
  status,
  statusText: status === 204 ? 'No Content' : 'OK',
  headers: {},
});
const useAdapter = (adapter: AxiosAdapter) => {
  apiClient.defaults.adapter = (config) => {
    requests.push(config);
    return adapter(config);
  };
};

beforeEach(() => {
  vi.resetAllMocks();
  completeAuthTransition(beginAuthTransition(), 1);
  requests.length = 0;
  mocks.getItemAsync.mockResolvedValue('fixture-access-token');
});
afterEach(() => {
  apiClient.defaults.adapter = originalAdapter;
});

describe('공통 HTTP 인터셉터를 통한 생성 친구 클라이언트 호출', () => {
  it('저장된 Bearer 토큰으로 친구와 받은 요청 목록을 조회한다', async () => {
    const friends = [
      { friendshipId: 51, user: { userId: 3, displayName: '친구', email: 'friend@example.com' } },
    ];
    const received = [
      { requestId: 92, user: { userId: 4, displayName: '요청자', email: 'request@example.com' } },
    ];
    useAdapter(async (config) => response(config, config.url === '/friends' ? friends : received));

    await expect(api.getFriends()).resolves.toEqual(friends);
    await expect(api.getReceivedRequests()).resolves.toEqual(received);
    expect(requests.map(({ method, url }) => [method, url])).toEqual([
      ['get', '/friends'],
      ['get', '/friends/requests/received'],
    ]);
    for (const request of requests) {
      expect(request.baseURL).toBe('https://api-dev.detoxmate.co.kr');
      expect(request.headers.get('Authorization')).toBe('Bearer fixture-access-token');
      expect(request.skipAuth).toBeUndefined();
      expect(request.skipAuthRefresh).toBeUndefined();
      expect(request.timeout).toBe(15_000);
    }
    expect(mocks.getItemAsync).toHaveBeenCalledWith('accessTokenKey');
  });

  it('요청 ID로 친구 요청을 수락하면 친구 관계 응답을 그대로 반환한다', async () => {
    const friendship = { friendshipId: 501, user: { userId: 7, displayName: '새 친구' } };
    useAdapter(async (config) => response(config, friendship));
    await expect(api.acceptRequest(92)).resolves.toEqual(friendship);
    expect(requests[0]).toMatchObject({ method: 'post', url: '/friends/requests/92/accept' });
  });

  it('요청과 친구 관계를 각각의 경로로 삭제하고 204 응답을 처리한다', async () => {
    useAdapter(async (config) => response(config, undefined, 204));
    await expect(api.deletePendingRequest(92)).resolves.toBeUndefined();
    await expect(api.unfriend(501)).resolves.toBeUndefined();
    expect(requests.map(({ method, url }) => [method, url])).toEqual([
      ['delete', '/friends/requests/92'],
      ['delete', '/friends/501'],
    ]);
  });

  it.each(['ERR_NETWORK', 'ECONNABORTED'])(
    '%s 오류가 발생하면 전역 재시도 큐에 넣지 않고 inline 재시도를 위해 즉시 실패를 반환한다',
    async (code) => {
      useAdapter(async (config) => {
        throw new AxiosError('Network Error', code, config);
      });
      await expect(api.getFriends()).rejects.toMatchObject({
        isAppError: true,
        type: code === 'ERR_NETWORK' ? 'network' : 'timeout',
      });
      expect(requests).toHaveLength(1);
      expect(requests[0]).toMatchObject({
        errorPolicy: { presentation: 'inline' },
        retryPolicy: 'none',
        skipGlobalError: true,
      });
      expect(mocks.enqueueNetworkRetryRequest).not.toHaveBeenCalled();
      expect(mocks.showMessage).not.toHaveBeenCalled();
    }
  );

  it('서버 오류가 발생하면 전역 메시지를 추가로 표시하지 않고 화면에 오류를 반환한다', async () => {
    const payload = { code: 'FRIEND_REQUEST_NOT_FOUND', message: '요청을 찾을 수 없습니다.' };
    useAdapter(async (config) => {
      throw new AxiosError(
        'Not Found',
        'ERR_BAD_REQUEST',
        config,
        undefined,
        response(config, payload, 404)
      );
    });
    await expect(api.acceptRequest(92)).rejects.toMatchObject({
      isAppError: true,
      status: 404,
      code: payload.code,
      payload,
    });
    expect(mocks.enqueueNetworkRetryRequest).not.toHaveBeenCalled();
    expect(mocks.showMessage).not.toHaveBeenCalled();
  });

  it('두 요청에 401 응답이 발생하면 토큰을 한 번만 갱신하고 두 요청을 재시도한다', async () => {
    const refreshing = Promise.withResolvers<void>();
    const initialRequests = Promise.withResolvers<void>();
    let dispatched = 0;
    mocks.refreshAccessToken.mockImplementation(async () => {
      await refreshing.promise;
      mocks.getItemAsync.mockResolvedValue('fixture-refreshed-token');
    });
    useAdapter(async (config) => {
      if (!config._retry) {
        if (++dispatched === 2) initialRequests.resolve();
        throw new AxiosError(
          'Unauthorized',
          'ERR_BAD_REQUEST',
          config,
          undefined,
          response(config, {}, 401)
        );
      }
      return response(config, []);
    });
    const reading = Promise.all([api.getFriends(), api.getReceivedRequests()]);
    await initialRequests.promise;
    // 토큰 갱신을 완료하기 전에 실패한 두 요청이 응답 인터셉터에 진입하도록 한다.
    await new Promise<void>((resolve) => setImmediate(resolve));
    refreshing.resolve();
    await expect(reading).resolves.toEqual([[], []]);
    expect(mocks.refreshAccessToken).toHaveBeenCalledOnce();
    expect(mocks.clearAuthSession).not.toHaveBeenCalled();
    expect(mocks.replace).not.toHaveBeenCalled();
  });

  it('이전 세션의 401 응답이 늦게 도착해도 새 로그인 토큰을 갱신하거나 세션을 삭제하지 않는다', async () => {
    let rejectOld!: () => void;
    const started = Promise.withResolvers<void>();
    useAdapter(
      (config) =>
        new Promise((_, reject) => {
          rejectOld = () =>
            reject(
              new AxiosError(
                'Unauthorized',
                'ERR_BAD_REQUEST',
                config,
                undefined,
                response(config, {}, 401)
              )
            );
          started.resolve();
        })
    );
    const reading = api.getFriends();
    const rejection = expect(reading).rejects.toMatchObject({ type: 'auth' });
    await started.promise;
    completeAuthTransition(beginAuthTransition(), 2);
    rejectOld();
    await rejection;
    expect(mocks.refreshAccessToken).not.toHaveBeenCalled();
    expect(mocks.clearAuthSession).not.toHaveBeenCalled();
    expect(mocks.replace).not.toHaveBeenCalled();
  });

  it('새 로그인 정보를 저장하는 중 이전 토큰 갱신이 실패해도 새 세션을 삭제하지 않는다', async () => {
    const started = Promise.withResolvers<void>();
    const refreshing = Promise.withResolvers<void>();
    mocks.refreshAccessToken.mockImplementation(() => {
      started.resolve();
      return refreshing.promise;
    });
    useAdapter(async (config) => {
      throw new AxiosError(
        'Unauthorized',
        'ERR_BAD_REQUEST',
        config,
        undefined,
        response(config, {}, 401)
      );
    });
    const rejection = expect(api.getFriends()).rejects.toMatchObject({ isAppError: true });
    await started.promise;
    // 새 로그인 토큰을 저장하는 동안 세션 범위는 일시적으로 null이다.
    const next = beginAuthTransition();
    refreshing.reject(new Error('old refresh failed'));
    await rejection;
    completeAuthTransition(next, 2);
    expect(mocks.clearAuthSession).not.toHaveBeenCalled();
    expect(mocks.replace).not.toHaveBeenCalled();
  });
});
