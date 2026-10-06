import { AxiosError, type InternalAxiosRequestConfig } from 'axios';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import apiClient from './client';
import { friendAxios } from './friendMutator';

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
  env: { apiBaseUrl: 'https://api.example.com', appEnv: 'production' },
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
const response = (config: InternalAxiosRequestConfig, data: unknown, status = 200) => ({
  config,
  data,
  status,
  statusText: 'OK',
  headers: {},
});

beforeEach(() => {
  vi.resetAllMocks();
  mocks.getItemAsync.mockResolvedValue('fixture-access-token');
});

afterEach(() => {
  apiClient.defaults.adapter = originalAdapter;
});

describe('공통 API 클라이언트의 인증 경합과 오류 처리', () => {
  it('두 요청이 동시에 인증에 실패하면 토큰을 한 번 갱신하고 두 요청을 완료한다', async () => {
    const refreshing = Promise.withResolvers<void>();
    const initialRequests = Promise.withResolvers<void>();
    let dispatched = 0;
    mocks.refreshAccessToken.mockImplementation(async () => {
      await refreshing.promise;
      mocks.getItemAsync.mockResolvedValue('fixture-refreshed-token');
    });
    apiClient.defaults.adapter = async (config) => {
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
      return response(config, '완료');
    };

    const reading = Promise.all([
      apiClient.get('/private/first'),
      apiClient.get('/private/second'),
    ]);
    await initialRequests.promise;
    // 갱신 완료 전에 실패한 두 요청이 응답 인터셉터에 진입하도록 이벤트 루프를 비운다.
    await new Promise<void>((resolve) => setImmediate(resolve));
    refreshing.resolve();

    const responses = await reading;
    expect(responses.map(({ data }) => data)).toEqual(['완료', '완료']);
    expect(mocks.refreshAccessToken).toHaveBeenCalledOnce();
    expect(mocks.clearAuthSession).not.toHaveBeenCalled();
    expect(mocks.replace).not.toHaveBeenCalled();
  });

  it('화면이 처리할 네트워크 실패는 전역 재시도 큐에 대기하지 않고 화면에 반환한다', async () => {
    apiClient.defaults.adapter = async (config) => {
      throw new AxiosError('Network Error', 'ERR_NETWORK', config);
    };

    await expect(friendAxios({ url: '/private/resource' })).rejects.toBeDefined();

    expect(mocks.enqueueNetworkRetryRequest).not.toHaveBeenCalled();
    expect(mocks.showMessage).not.toHaveBeenCalled();
  });
});
