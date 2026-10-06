import { AxiosError, type AxiosAdapter, type InternalAxiosRequestConfig } from 'axios';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import apiClient from './client';
import { beginAuthTransition, completeAuthTransition } from '../stores/authSessionStore';
import { getFriend } from './generated/friend/friend';

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
const api = getFriend();
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

describe('generated friend client through shared HTTP interceptors', () => {
  it('reads friends and received request arrays with the stored bearer token', async () => {
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

  it('accepts a request ID and preserves the friendship response', async () => {
    const friendship = { friendshipId: 501, user: { userId: 7, displayName: '새 친구' } };
    useAdapter(async (config) => response(config, friendship));
    await expect(api.acceptRequest(92)).resolves.toEqual(friendship);
    expect(requests[0]).toMatchObject({ method: 'post', url: '/friends/requests/92/accept' });
  });

  it('uses separate request and friendship deletion routes and handles 204', async () => {
    useAdapter(async (config) => response(config, undefined, 204));
    await expect(api.deletePendingRequest(92)).resolves.toBeUndefined();
    await expect(api.unfriend(501)).resolves.toBeUndefined();
    expect(requests.map(({ method, url }) => [method, url])).toEqual([
      ['delete', '/friends/requests/92'],
      ['delete', '/friends/501'],
    ]);
  });

  it.each(['ERR_NETWORK', 'ECONNABORTED'])(
    'rejects %s promptly for inline retry without the global queue',
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

  it('returns backend failures to the screen without a second global message', async () => {
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

  it('retains shared 401 refresh and retries with the refreshed bearer token', async () => {
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
    // Let both rejected requests enter the response interceptor before releasing refresh.
    await new Promise<void>((resolve) => setImmediate(resolve));
    refreshing.resolve();
    await expect(reading).resolves.toEqual([[], []]);
    expect(mocks.refreshAccessToken).toHaveBeenCalledOnce();
    expect(mocks.clearAuthSession).not.toHaveBeenCalled();
    expect(mocks.replace).not.toHaveBeenCalled();
  });

  it('does not refresh or clear the next login for a late old-session 401', async () => {
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

  it('does not clear a login still being persisted when an old refresh fails', async () => {
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
    // The scope is temporarily null here while a new login persists its tokens.
    const next = beginAuthTransition();
    refreshing.reject(new Error('old refresh failed'));
    await rejection;
    completeAuthTransition(next, 2);
    expect(mocks.clearAuthSession).not.toHaveBeenCalled();
    expect(mocks.replace).not.toHaveBeenCalled();
  });
});
