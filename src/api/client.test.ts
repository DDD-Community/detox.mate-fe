import { AxiosError, CanceledError, type InternalAxiosRequestConfig } from 'axios';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import apiClient from './client';
import { changeAuthQueryScope } from '../lib/query/authQueryScope';
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
  it('친구 요청의 인증 값 복원 중 계정이 바뀌면 새 계정으로 이전 쓰기를 보내지 않는다', async () => {
    const credentials = Promise.withResolvers<string>();
    const started = Promise.withResolvers<void>();
    mocks.getItemAsync.mockImplementation(() => {
      started.resolve();
      return credentials.promise;
    });
    const dispatch = vi.fn();
    apiClient.defaults.adapter = dispatch;
    changeAuthQueryScope('first-user');
    const writing = friendAxios({
      url: '/friends/requests',
      method: 'POST',
      data: { targetUserId: 3 },
    });
    const rejected = expect(writing).rejects.toMatchObject({ code: 'ERR_CANCELED' });
    await started.promise;
    changeAuthQueryScope('second-user');
    credentials.resolve('fictional-second-account-credential');
    await rejected;
    expect(dispatch).not.toHaveBeenCalled();
  });

  it('이전 계정 친구 요청의 늦은 인증 실패는 현재 계정 토큰을 갱신하거나 로그아웃시키지 않는다', async () => {
    const result = Promise.withResolvers<never>();
    const dispatched = Promise.withResolvers<InternalAxiosRequestConfig>();
    apiClient.defaults.adapter = (config) => {
      dispatched.resolve(config);
      return result.promise;
    };
    changeAuthQueryScope('first-user');
    const writing = friendAxios({
      url: '/friends/requests',
      method: 'POST',
      data: { targetUserId: 3 },
    });
    const rejected = expect(writing).rejects.toMatchObject({ code: 'ERR_CANCELED' });
    const config = await dispatched.promise;
    changeAuthQueryScope('second-user');
    result.reject(
      new AxiosError(
        'Unauthorized',
        'ERR_BAD_REQUEST',
        config,
        undefined,
        response(config, {}, 401)
      )
    );
    await rejected;
    expect(mocks.refreshAccessToken).not.toHaveBeenCalled();
    expect(mocks.clearAuthSession).not.toHaveBeenCalled();
  });

  it('계정 변경으로 진행 중 토큰 갱신이 취소되면 현재 계정을 로그아웃시키지 않는다', async () => {
    const refreshed = Promise.withResolvers<void>();
    const started = Promise.withResolvers<void>();
    mocks.refreshAccessToken.mockImplementation(() => {
      started.resolve();
      return refreshed.promise;
    });
    apiClient.defaults.adapter = async (config) => {
      throw new AxiosError(
        'Unauthorized',
        'ERR_BAD_REQUEST',
        config,
        undefined,
        response(config, {}, 401)
      );
    };
    changeAuthQueryScope('first-user');
    const writing = friendAxios({
      url: '/friends/requests',
      method: 'POST',
      data: { targetUserId: 3 },
    });
    const rejected = expect(writing).rejects.toMatchObject({ code: 'ERR_CANCELED' });
    await started.promise;
    changeAuthQueryScope('second-user');
    refreshed.reject(new CanceledError('The authentication session changed.'));
    await rejected;
    expect(mocks.clearAuthSession).not.toHaveBeenCalled();
    expect(mocks.replace).not.toHaveBeenCalled();
  });

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
