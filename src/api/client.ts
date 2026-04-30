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
    if (error.response?.status == 401) {
      try {
        await refreshAccessToken();
        return apiClient(error.config);
      } catch (refreshError) {
        await logout();
        router.replace('/login');
        return Promise.reject(refreshError);
      }
    }
    return Promise.reject(error);
  }
);

export default apiClient;
