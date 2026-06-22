import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import * as Notifications from 'expo-notifications';
import { useState } from 'react';
import * as SecureStore from 'expo-secure-store';

import {
  type OAuthLoginResponse,
  loginWithApple,
  loginWithKakao,
  loginWithTestUser,
} from '@/api/auth';
import { logError, normalizeError } from '@/api/errors';
import type { AppError } from '@/api/errors/types';
import { registerDevicePushToken } from '@/lib/fcmToken';
import { setAnalyticsUserId, trackEvent } from '@/lib/analytics';
import { consumePendingInviteCode } from '@/lib/pendingInvite';
import { APP_ACCESS_PERMISSION_GUIDE_SEEN_KEY, TERMS_ACCEPTED_KEY } from './authStorageKeys';

export type LoginProvider = 'kakao' | 'apple' | 'test';

type LoginAction = () => Promise<OAuthLoginResponse>;
export type TestUserKey = string;

export const TEST_USER_KEYS: TestUserKey[] = [
  'front-a',
  'front-b',
  'front-c',
  'server-a',
  'server-b',
  'server-c',
];

const NATIVE_PERMISSION_PROMPT_DELAY_MS = 350;

const waitForPermissionPromptReady = () =>
  new Promise<void>((resolve) => setTimeout(resolve, NATIVE_PERMISSION_PROMPT_DELAY_MS));

interface UseAuthLoginOptions {
  onLoginFailure?: (error: AppError) => void;
}

export function useAuthLogin({ onLoginFailure }: UseAuthLoginOptions = {}) {
  const router = useRouter();
  const [pendingProvider, setPendingProvider] = useState<LoginProvider | null>(null);
  const [permissionGuideVisible, setPermissionGuideVisible] = useState(false);
  const [permissionGuideConfirming, setPermissionGuideConfirming] = useState(false);

  // 로그인 완료 후, 딥링크로 들어온 대기 초대 코드가 있으면 초대 화면으로,
  // 없으면 기본 그룹 홈으로 이동한다.
  const navigateAfterLogin = async () => {
    const inviteCode = await consumePendingInviteCode();
    if (inviteCode) {
      router.replace({ pathname: '/(group)/join', params: { inviteCode } });
    } else {
      router.replace('/(group)/home');
    }
  };

  const completeLogin = async (provider: LoginProvider, login: LoginAction) => {
    if (pendingProvider) return;

    setPendingProvider(provider);
    try {
      const user = await login();
      setAnalyticsUserId(user.id);
      trackEvent('Login Completed', { is_new_user: user.isNewUser });

      await SecureStore.setItemAsync(TERMS_ACCEPTED_KEY, 'true');
      try {
        await registerDevicePushToken();
      } catch {
        // 토큰 등록 실패는 로그인 흐름을 막지 않음
      }

      const hasSeenPermissionGuide = await SecureStore.getItemAsync(
        APP_ACCESS_PERMISSION_GUIDE_SEEN_KEY
      );
      if (hasSeenPermissionGuide === 'true') {
        await navigateAfterLogin();
      } else {
        setPermissionGuideVisible(true);
      }
    } catch (error) {
      const appError = normalizeError(error);
      logError(appError, { scope: 'auth.login', provider });
      onLoginFailure?.(appError);
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

  const handleConfirmPermissionGuide = async () => {
    if (permissionGuideConfirming) return;

    setPermissionGuideConfirming(true);
    setPermissionGuideVisible(false);

    try {
      await waitForPermissionPromptReady();
      await ImagePicker.requestMediaLibraryPermissionsAsync();
      await Notifications.requestPermissionsAsync();

      try {
        await registerDevicePushToken();
      } catch {
        // 권한 허용 후 토큰 등록 실패는 다음 로그인/설정 진입 시 재시도됨
      }
    } finally {
      await SecureStore.setItemAsync(APP_ACCESS_PERMISSION_GUIDE_SEEN_KEY, 'true');
      setPermissionGuideConfirming(false);
      await navigateAfterLogin();
    }
  };

  return {
    handleKakaoLogin,
    handleAppleLogin,
    handleTestLogin,
    handleConfirmPermissionGuide,
    pendingProvider,
    permissionGuideConfirming,
    permissionGuideVisible,
  };
}
