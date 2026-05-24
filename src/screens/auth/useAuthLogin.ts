import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert } from 'react-native';

import { loginWithKakao, loginWithNewTestUser } from '@/api/auth';
import { registerDevicePushToken } from '@/lib/fcmToken';

export type LoginProvider = 'kakao' | 'test';

type LoginAction = () => Promise<unknown>;

export function useAuthLogin() {
  const router = useRouter();
  const [pendingProvider, setPendingProvider] = useState<LoginProvider | null>(null);

  const completeLogin = async (provider: LoginProvider, login: LoginAction) => {
    if (pendingProvider) return;

    setPendingProvider(provider);
    try {
      await login();
      try {
        await registerDevicePushToken();
      } catch {
        // 토큰 등록 실패는 로그인 흐름을 막지 않음
      }
      router.replace('/(group)/home');
    } catch {
      Alert.alert('로그인 실패', '로그인을 처리하지 못했어요. 잠시 후 다시 시도해주세요.');
    } finally {
      setPendingProvider(null);
    }
  };

  const handleKakaoLogin = () => {
    completeLogin('kakao', loginWithKakao);
  };

  const handleTestLogin = () => {
    completeLogin('test', loginWithNewTestUser);
  };

  return {
    handleKakaoLogin,
    handleTestLogin,
    pendingProvider,
  };
}
