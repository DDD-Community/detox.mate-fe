import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert } from 'react-native';

import { type OAuthLoginResponse, loginWithApple, loginWithKakao, loginWithTestUser } from '@/api/auth';
import { registerDevicePushToken } from '@/lib/fcmToken';

export type LoginProvider = 'kakao' | 'apple' | 'test';

type LoginAction = () => Promise<OAuthLoginResponse>;
export type TestUserKey = 'front-a' | 'front-b' | 'front-c' | 'server-a' | 'server-b' | 'server-c';

export const TEST_USER_KEYS: TestUserKey[] = [
  'front-a',
  'front-b',
  'front-c',
  'server-a',
  'server-b',
  'server-c',
];

export function useAuthLogin() {
  const router = useRouter();
  const [pendingProvider, setPendingProvider] = useState<LoginProvider | null>(null);

  const completeLogin = async (provider: LoginProvider, login: LoginAction) => {
    if (pendingProvider) return;

    setPendingProvider(provider);
    try {
      const result = await login();
      try {
        await registerDevicePushToken();
      } catch {
        // 토큰 등록 실패는 로그인 흐름을 막지 않음
      }
      // 서버가 신규 유저로 판단하면 온보딩부터 시작
      // (탈퇴 후 앱 미종료 상태에서 재가입하는 경우 등)
      if (result.isNewUser) {
        router.replace('/onboarding');
      } else {
        router.replace('/(group)/home');
      }
    } catch {
      Alert.alert('로그인 실패', '로그인을 처리하지 못했어요. 잠시 후 다시 시도해주세요.');
    } finally {
      setPendingProvider(null);
    }
  };

  const handleKakaoLogin = () => {
    completeLogin('kakao', loginWithKakao);
  };

  const handleAppleLogin = () => {
    completeLogin('apple', loginWithApple);
  };

  const handleTestLogin = (testUserKey: TestUserKey) => {
    completeLogin('test', () => loginWithTestUser(testUserKey));
  };

  return {
    handleKakaoLogin,
    handleAppleLogin,
    handleTestLogin,
    pendingProvider,
  };
}
