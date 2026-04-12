import { KakaoOAuthToken, login } from '@react-native-seoul/kakao-login';
import axios from 'axios';

export type ServiceLoginResponse = {
  id: number;
  displayName: string;
  accessToken: string;
  accessTokenExpiresIn: number;
  isNewMember: boolean;
};

export async function signInWithKakao(): Promise<ServiceLoginResponse> {
  const kakaoToken: KakaoOAuthToken = await login();

  const { data } = await axios.post<ServiceLoginResponse>(
    'https://api-dev.detoxmate.co.kr/auth/social/kakao', // API URL
    {
      providerAccessToken: kakaoToken.accessToken,
      // idToken: kakaoToken.idToken ?? null,
    }
  );

  return data;
}
