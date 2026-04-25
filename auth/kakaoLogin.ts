import { KakaoOAuthToken, login } from '@react-native-seoul/kakao-login';
import * as SecureStore from 'expo-secure-store';
import apiClient from '../api/client';

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

  const {accessToken, refreshToken} = data
  await SecureStore.setItemAsync('accessTokenKey', accessToken);
  await SecureStore.setItemAsync('refreshTokenKey', refreshToken);

  return data;
}

export async function refreshAccessToken(): Promise<ServerResponseTokens> {
  const refreshToken = await SecureStore.getItemAsync('refreshTokenKey');

  try {
    const { data } = await apiClient.post<ServerResponseTokens>('/auth/refresh', {
      refreshToken: refreshToken,
    });

    const accessToken = data.accessToken;
    const updatedRefreshToken = data.refreshToken;
    await SecureStore.setItemAsync('accessTokenKey', accessToken);
    await SecureStore.setItemAsync('refreshTokenKey', updatedRefreshToken);

    return data;
  } catch (error) {
    // refreshAccessToken이 실패하면 여러 에러 중 401 에러가 RT가 만료되었다는 것을 의미
    // 근데 다 로그아웃 시키는 게 맞나?
    await logout();
    throw new Error('다시 로그인해 주세요.');
    // 로그인 화면으로 redirect
  }
}

export async function logout(): Promise<void> {
  const refreshToken = await SecureStore.getItemAsync('refreshTokenKey');

  await apiClient.post('/auth/logout', {
    refreshToken,
  });

  await SecureStore.deleteItemAsync('refreshTokenKey');
  await SecureStore.deleteItemAsync('accessTokenKey');
}
