import axios, { AxiosError, type AxiosRequestConfig } from 'axios';
import { router } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import { clearAuthSession, refreshAccessToken } from './auth';
import { useNetworkErrorToastStore } from '../stores/networkErrorToastStore';
import { env } from '../config/env';
import { canRetryRequest, handleRequestError, logError, normalizeError } from './errors';

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

const shouldSuppressGlobalError = (config: AxiosRequestConfig | undefined, presentation: string) =>
  Boolean(
    config?.skipGlobalError ||
    config?.skipAuthRefresh ||
    presentation === 'inline' ||
    presentation === 'dialog' ||
    presentation === 'silent'
  );

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
        const appError = normalizeError(refreshError);
        logError(appError, { scope: 'auth.refresh', operation: 'refreshAccessToken' });
        await clearAuthSession();
        router.replace({ pathname: '/login', params: { reason: 'sessionExpired' } });
        return Promise.reject(appError);
      }
    }

    const handled = handleRequestError(error, originalRequest?.errorPolicy);
    const suppressGlobalError = shouldSuppressGlobalError(originalRequest, handled.presentation);

    if (handled.shouldLog) {
      logError(handled.error, {
        scope: 'api',
        path: originalRequest?.url,
        method: originalRequest?.method,
      });
    }

    if (
      (handled.error.type === 'network' || handled.error.type === 'timeout') &&
      canRetryRequest(originalRequest, handled.error) &&
      originalRequest &&
      !suppressGlobalError
    ) {
      const { enqueueNetworkRetryRequest } = useNetworkErrorToastStore.getState();
      return await enqueueNetworkRetryRequest({
        retry: () => apiClient(originalRequest),
        cancelError: handled.error,
      });
    }

    if (handled.presentation === 'toast' && !suppressGlobalError) {
      useNetworkErrorToastStore.getState().showMessage(handled.message);
    }

    return Promise.reject(handled.error);
  }
);

export default apiClient;
