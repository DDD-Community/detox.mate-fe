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
    // config.headers['Authorization'] = `Bearer ${accessToken}`;
    config.headers['Authorization'] = `Bearer ${accessToken}aadssa`;
  }
  return config;
});

// response interceptor
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status == 401 && error.config.url != '/auth/refresh') {
      try {
        const data = await refreshAccessToken();
        const accessToken = data.accessToken;
        const refreshToken = data.refreshToken;
        await SecureStore.setItemAsync('accessTokenKey', accessToken);
        await SecureStore.setItemAsync('refreshTokenKey', refreshToken);

        return apiClient(error.config);
      } catch (error) {
        logout();
        // 로그인 화면으로 redirect
      }
    }
  }
);

export default apiClient;
