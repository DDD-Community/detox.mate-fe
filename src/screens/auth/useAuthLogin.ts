import { useRouter } from 'expo-router';
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
import { TERMS_ACCEPTED_KEY } from './authStorageKeys';

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
interface UseAuthLoginOptions {
  onLoginFailure?: (error: AppError) => void;
}

export function useAuthLogin({ onLoginFailure }: UseAuthLoginOptions = {}) {
  const router = useRouter();
  const [pendingProvider, setPendingProvider] = useState<LoginProvider | null>(null);
  const [termsVisible, setTermsVisible] = useState(false);
  const selectedLogin = useRef<{ provider: LoginProvider; login: LoginAction } | null>(null);
  const busy = useRef(false);
  const active = useRef(true);
  useEffect(() => {
    active.current = true;
    return () => {
      active.current = false;
    };
  }, []);

  const completeLogin = async (provider: LoginProvider, login: LoginAction, agreed = false) => {
    if (busy.current) return;
    busy.current = true;
    setPendingProvider(provider);
    try {
      if (agreed) await SecureStore.setItemAsync(TERMS_ACCEPTED_KEY, 'true');
      else if ((await SecureStore.getItemAsync(TERMS_ACCEPTED_KEY)) !== 'true') {
        if (active.current) {
          selectedLogin.current = { provider, login };
          setTermsVisible(true);
        }
        return;
      }
      setTermsVisible(false);
      selectedLogin.current = null;
      const user = await login();
      if (!active.current) return;
      setAnalyticsUserId(user.id);
      trackEvent('Login Completed', { is_new_user: user.isNewUser });
      try {
        await registerDevicePushToken();
      } catch (error) {
        logError(normalizeError(error), {
          scope: 'notification.push',
          operation: 'registerDevicePushToken',
        });
      }
      if (!active.current) return;
      if (user.isNewUser) router.replace('/onboarding');
      else
        await navigateAuthenticated({
          replace: (destination) => router.replace(destination),
          isActive: () => active.current,
          resolveDefault: async () => '/(tabs)/restricted-apps',
        });
    } catch (error) {
      const appError = normalizeError(error);
      logError(appError, { scope: 'auth.login', provider });
      if (active.current) onLoginFailure?.(appError);
    } finally {
      busy.current = false;
      if (active.current) setPendingProvider(null);
    }
  };
  const confirmTerms = () => {
    const selection = selectedLogin.current;
    if (selection) return completeLogin(selection.provider, selection.login, true);
  };
  const closeTerms = () => {
    if (!busy.current) {
      selectedLogin.current = null;
      setTermsVisible(false);
    }
  };
  return {
    handleKakaoLogin: () => completeLogin('kakao', loginWithKakao),
    handleAppleLogin: () => completeLogin('apple', loginWithApple),
    handleTestLogin: (key: TestUserKey) => completeLogin('test', () => loginWithTestUser(key)),
    pendingProvider,
    termsVisible,
    confirmTerms,
    closeTerms,
  };
}
