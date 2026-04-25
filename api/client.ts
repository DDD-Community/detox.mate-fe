import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import { logout, refreshAccessToken } from '../auth/kakaoLogin';

// axios instance
const apiClient = axios.create({
  baseURL: 'https://api-dev.detoxmate.co.kr',
});

// request interceptor
apiClient.interceptors.request.use(async (config) => {
  const accessToken = await SecureStore.getItemAsync('accessTokenKey');
  if (accessToken) {
    config.headers['Authorization'] = `Bearer ${accessToken}`;
  }
  return config;
});

// response interceptor
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status == 401) {
      try {
        await refreshAccessToken();
        return apiClient(error.config);
      } catch (error) {
        logout();
        // TODO: 로그인 화면으로 redirect
      }
    }
  }
);

export default apiClient;
