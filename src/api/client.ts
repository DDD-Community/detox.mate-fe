import axios from 'axios';
import { router } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import { logout, refreshAccessToken } from './auth';

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

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const requestUrl: string = error.config?.url ?? '';
    // /auth/ 엔드포인트는 재시도하지 않음 — 인터셉터 루프 방지
    const isAuthEndpoint = requestUrl.includes('/auth/');
    if (error.response?.status === 401 && !isAuthEndpoint) {
      try {
        await refreshAccessToken();
        return apiClient(error.config);
      } catch (refreshError) {
        await logout();
        router.replace('/login?toast=session');
        return Promise.reject(refreshError);
      }
    }
    return Promise.reject(error);
  }
);

export default apiClient;
