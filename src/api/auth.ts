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
  await SecureStore.setItemAsync('currentUserId', String(data.id));

  return data;
}

export async function refreshAccessToken(): Promise<ServerResponseTokens> {
  const refreshToken = await SecureStore.getItemAsync('refreshTokenKey');

  try {
    const { data } = await apiClient.post<ServerResponseTokens>('/auth/refresh', {
      refreshToken: refreshToken,
    });

    const { accessToken, refreshToken: updatedRefreshToken } = data;
    await SecureStore.setItemAsync('accessTokenKey', accessToken);
    await SecureStore.setItemAsync('refreshTokenKey', updatedRefreshToken);

    return data;
  } catch (error) {
    await logout();
    throw new Error('다시 로그인해 주세요.');
  }
}

export async function logout(): Promise<void> {
  const refreshToken = await SecureStore.getItemAsync('refreshTokenKey');

  await apiClient.post('/auth/logout', {
    refreshToken,
  });

  await SecureStore.deleteItemAsync('refreshTokenKey');
  await SecureStore.deleteItemAsync('accessTokenKey');
  await SecureStore.deleteItemAsync('currentUserId');
}
