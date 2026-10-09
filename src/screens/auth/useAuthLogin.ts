import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import * as Notifications from 'expo-notifications';
import { useEffect, useRef, useState } from 'react';
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
import { navigateAuthenticated } from '@/lib/inviteDestination';
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
  const loginInFlight = useRef(false);
  const [permissionGuideVisible, setPermissionGuideVisible] = useState(false);
  const [permissionGuideConfirming, setPermissionGuideConfirming] = useState(false);
  const active = useRef(true);
  useEffect(() => {
    active.current = true;
    return () => {
      active.current = false;
    };
  }, []);

  // 로그인 완료 후, 딥링크로 들어온 대기 초대 코드가 있으면 초대 화면으로,
  // 없으면 기본 그룹 홈으로 이동한다.
  const navigateAfterLogin = async () => {
    await navigateAuthenticated({
      replace: (destination) => router.replace(destination),
      isActive: () => active.current,
      resolveDefault: async () => '/(group)/home',
    });
  };

  const completeLogin = async (provider: LoginProvider, login: LoginAction) => {
    if (loginInFlight.current) return;

    loginInFlight.current = true;
    setPendingProvider(provider);
    try {
      const user = await login();
      if (!active.current) return;
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
      if (!active.current) return;
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
      loginInFlight.current = false;
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
    } catch (error) {
      const appError = normalizeError(error);
      logError(appError, { scope: 'auth.login', operation: 'requestPermissions' });
      onLoginFailure?.(appError);
    } finally {
      try {
        await SecureStore.setItemAsync(APP_ACCESS_PERMISSION_GUIDE_SEEN_KEY, 'true');
        await navigateAfterLogin();
      } catch (error) {
        const appError = normalizeError(error);
        logError(appError, { scope: 'app.bootstrap', operation: 'navigateAfterLogin' });
        onLoginFailure?.(appError);
      } finally {
        setPermissionGuideConfirming(false);
      }
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
