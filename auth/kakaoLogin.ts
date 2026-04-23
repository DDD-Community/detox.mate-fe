import { KakaoOAuthToken, login } from '@react-native-seoul/kakao-login';
import axios from 'axios';
import * as SecureStore from 'expo-secure-store';

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

  const { data } = await axios.post<OAuthLoginResponse>(
    'https://api-dev.detoxmate.co.kr/auth/social/kakao',
    {
      providerAccessToken: kakaoToken.accessToken,
    }
  );

  const accessToken = data.accessToken;
  const refreshToken = data.refreshToken;
  await SecureStore.setItemAsync('accessTokenKey', accessToken);
  await SecureStore.setItemAsync('refreshTokenKey', refreshToken);

  return data;
}

export async function refreshAccessToken(): Promise<ServerResponseTokens> {
  const refreshToken = await SecureStore.getItemAsync('refreshTokenKey');

  try {
    const { data } = await axios.post<ServerResponseTokens>(
      'https://api-dev.detoxmate.co.kr/auth/refresh',
      {
        refreshToken: refreshToken,
      }
    );
    return data;
  } catch (error) {
    await logout();
    throw new Error('다시 로그인해 주세요.');
    // 이 부분은 추후에 코드를 추가하여, 로그인 화면으로 redirect 한다.
  }
}

export async function logout(): Promise<void> {
  const refreshToken = await SecureStore.getItemAsync('refreshTokenKey');

  const { status } = await axios.post('https://api-dev.detoxmate.co.kr/auth/logout', {
    refreshToken,
  });

  await SecureStore.deleteItemAsync('refreshTokenKey');
  await SecureStore.deleteItemAsync('accessTokenKey');
}
