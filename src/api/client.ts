import axios, { AxiosError } from 'axios';
import { router } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import { clearAuthSession, refreshAccessToken } from './auth';
import { useNetworkErrorToastStore } from '../stores/networkErrorToastStore';
import { env } from '../config/env';

const apiClient = axios.create({
  baseURL: env.apiBaseUrl,
});

const PUBLIC_AUTH_PATHS = [
  '/auth/social/kakao',
  '/auth/social/apple',
  '/auth/refresh',
  '/auth/logout',
  '/dev/auth/test-login',
];

const isPublicAuthRequest = (url?: string) =>
  Boolean(url && PUBLIC_AUTH_PATHS.some((path) => url.includes(path)));

let refreshPromise: Promise<unknown> | null = null;

apiClient.interceptors.request.use(async (config) => {
  if (config.skipAuth || isPublicAuthRequest(config.url)) {
    return config;
  }

  const accessToken = await SecureStore.getItemAsync('accessTokenKey');
  if (accessToken) {
    config.headers['Authorization'] = `Bearer ${accessToken}`;
  }
  return config;
});

const isNetworkError = (error: AxiosError) =>
  !error.response &&
  (error.code === 'ERR_NETWORK' ||
    error.code === 'ECONNABORTED' ||
    error.code === 'ETIMEDOUT' ||
    error.message === 'Network Error');

const DEFAULT_ERROR_MESSAGE = '요청을 처리하지 못했어요. 잠시 후 다시 시도해주세요';

const extractErrorMessage = (data: unknown): string | undefined => {
  if (!data || typeof data !== 'object') return undefined;
  const record = data as Record<string, unknown>;
  const candidate = record.message ?? record.error ?? record.errorMessage;
  return typeof candidate === 'string' && candidate.length > 0 ? candidate : undefined;
};

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config;
    const canRefresh =
      error.response?.status === 401 &&
      originalRequest &&
      !originalRequest._retry &&
      !originalRequest.skipAuthRefresh &&
      !isPublicAuthRequest(originalRequest.url);

    if (canRefresh) {
      originalRequest._retry = true;
      try {
        refreshPromise ??= refreshAccessToken().finally(() => {
          refreshPromise = null;
        });
        await refreshPromise;
        return apiClient(originalRequest);
      } catch (refreshError) {
        await clearAuthSession();
        router.replace('/login');
        return Promise.reject(refreshError);
      }
    }

    if (isNetworkError(error) && error.config) {
      const { enqueueNetworkRetry } = useNetworkErrorToastStore.getState();
      return new Promise((resolve, reject) => {
        enqueueNetworkRetry({
          retry: () => apiClient(error.config!).then(resolve).catch(reject),
          cancel: () => reject(error),
        });
      });
    }

    // 그 외 응답 에러(4xx/5xx)는 토스트로 안내
    if (error.response && !error.config?.skipAuthRefresh) {
      const message = extractErrorMessage(error.response.data) ?? DEFAULT_ERROR_MESSAGE;
      useNetworkErrorToastStore.getState().showMessage(message);
    }

    return Promise.reject(error);
  }
);

export default apiClient;
