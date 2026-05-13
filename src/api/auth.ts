import { KakaoOAuthToken, login } from '@react-native-seoul/kakao-login';
import * as SecureStore from 'expo-secure-store';
import apiClient from './client';

export type OAuthLoginResponse = {
  id: number;
  displayName: string;
  profileImageUrl: string | null;
  accessToken: string;
  refreshToken: string;
  isNewUser: boolean;
};

export type ServerResponseTokens = {
  refreshToken: string;
  accessToken: string;
};

export type ServerResponseStatus = {
  status: number;
};

export async function loginWithKakao(): Promise<OAuthLoginResponse> {
  const kakaoToken: KakaoOAuthToken = await login();

  const { data } = await apiClient.post<OAuthLoginResponse>('/auth/social/kakao', {
    providerAccessToken: kakaoToken.accessToken,
  });

  const { accessToken, refreshToken } = data;
  await SecureStore.setItemAsync('accessTokenKey', accessToken);
  await SecureStore.setItemAsync('refreshTokenKey', refreshToken);

  return data;
}

export async function refreshAccessToken(): Promise<ServerResponseTokens> {
  const refreshToken = await SecureStore.getItemAsync('refreshTokenKey');

  const { data } = await apiClient.post<ServerResponseTokens>('/auth/refresh', {
    refreshToken: refreshToken,
  });

  const { accessToken, refreshToken: updatedRefreshToken } = data;
  await SecureStore.setItemAsync('accessTokenKey', accessToken);
  await SecureStore.setItemAsync('refreshTokenKey', updatedRefreshToken);

  return data;
}

export async function logout(): Promise<void> {
  const refreshToken = await SecureStore.getItemAsync('refreshTokenKey');

  try {
    await apiClient.post('/auth/logout', { refreshToken });
  } catch {
    // 토큰이 이미 만료된 경우 logout API 실패는 무시하고 로컬 토큰만 삭제
  }

  await SecureStore.deleteItemAsync('refreshTokenKey');
  await SecureStore.deleteItemAsync('accessTokenKey');
}
