import axios, { AxiosError, CanceledError, isCancel, type AxiosRequestConfig } from 'axios';
import { router } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import { env } from '../config/env';
import { canRetryRequest, handleRequestError, logError, normalizeError } from './errors';
import { useNetworkErrorToastStore } from '../stores/networkErrorToastStore';
import { clearAuthSession, refreshAccessToken } from './auth';

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
let authenticatedRequests = new AbortController();

export const getAuthenticatedRequestSignal = () => authenticatedRequests.signal;

export function cancelAuthenticatedRequests() {
  authenticatedRequests.abort();
  refreshPromise = null;
}

export function resumeAuthenticatedRequests() {
  authenticatedRequests = new AbortController();
  refreshPromise = null;
}

apiClient.interceptors.request.use(async (config) => {
  if (config.skipAuth || isPublicAuthRequest(config.url)) {
    return config;
  }

  const authSignal = (config._authRequestSignal ??= getAuthenticatedRequestSignal());
  config.signal ??= authSignal;
  if (authSignal.aborted) {
    throw new CanceledError('The authentication session ended.');
  }
  const accessToken = await SecureStore.getItemAsync('accessTokenKey');
  if (authSignal.aborted) {
    throw new CanceledError('The authentication session ended.');
  }
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
const isNetworkError = (error: AxiosError) =>
  !error.response &&
  (error.code === 'ERR_NETWORK' ||
    error.code === 'ECONNABORTED' ||
    error.code === 'ETIMEDOUT' ||
    error.message === 'Network Error');

const DEFAULT_ERROR_MESSAGE = '요청을 처리하지 못했어요. 잠시 후 다시 시도해 주세요';

const extractErrorMessage = (data: unknown): string | undefined => {
  if (!data || typeof data !== 'object') return undefined;
  const record = data as Record<string, unknown>;
  const candidate = record.message ?? record.error ?? record.errorMessage;
  return typeof candidate === 'string' && candidate.length > 0 ? candidate : undefined;
};

apiClient.interceptors.response.use(
  (response) => {
    if (response.config._authRequestSignal?.aborted) {
      throw new CanceledError('The authentication session ended.');
    }
    return response;
  },
  async (error: AxiosError) => {
    if (isCancel(error)) return Promise.reject(error);
    const originalRequest = error.config;
    if (originalRequest?._authRequestSignal?.aborted) {
      return Promise.reject(new CanceledError('The authentication session ended.'));
    }
    const canRefresh =
      error.response?.status === 401 &&
      originalRequest &&
      !originalRequest._retry &&
      !originalRequest.skipAuthRefresh &&
      !isPublicAuthRequest(originalRequest.url);

    if (canRefresh) {
      originalRequest._retry = true;
      try {
        if (!refreshPromise) {
          const pendingRefresh = refreshAccessToken().finally(() => {
            if (refreshPromise === pendingRefresh) refreshPromise = null;
          });
          refreshPromise = pendingRefresh;
        }
        await refreshPromise;
        if (originalRequest._authRequestSignal?.aborted) {
          throw new CanceledError('The authentication session ended.');
        }
        return apiClient(originalRequest);
      } catch (refreshError) {
        if (isCancel(refreshError)) return Promise.reject(refreshError);
        const authSignal = originalRequest._authRequestSignal;
        if (authSignal && authSignal !== getAuthenticatedRequestSignal()) {
          return Promise.reject(new CanceledError('The authentication session ended.'));
        }
        const appError = normalizeError(refreshError);
        logError(appError, { scope: 'auth.refresh', operation: 'refreshAccessToken' });
        if (!authSignal?.aborted) await clearAuthSession();
        if (authSignal && authSignal !== getAuthenticatedRequestSignal()) {
          return Promise.reject(new CanceledError('The authentication session ended.'));
        }
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
