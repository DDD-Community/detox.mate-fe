import axios, { AxiosError } from 'axios';
import { router } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import { logout, refreshAccessToken } from './auth';
import { useNetworkErrorToastStore } from '../stores/networkErrorToastStore';

const apiClient = axios.create({
  baseURL: 'https://api-dev.detoxmate.co.kr',
});

apiClient.interceptors.request.use(async (config) => {
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

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    if (error.response?.status == 401) {
      try {
        await refreshAccessToken();
        return apiClient(error.config!);
      } catch (refreshError) {
        await logout();
        router.replace('/login');
        return Promise.reject(refreshError);
      }
    }

    if (isNetworkError(error) && error.config) {
      const { enqueue } = useNetworkErrorToastStore.getState();
      return new Promise((resolve, reject) => {
        enqueue({
          retry: () => apiClient(error.config!).then(resolve).catch(reject),
          cancel: () => reject(error),
        });
      });
    }

    return Promise.reject(error);
  }
);

export default apiClient;
