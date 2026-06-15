import { KakaoOAuthToken, login } from '@react-native-seoul/kakao-login';
import * as AppleAuthentication from 'expo-apple-authentication';
import { sha256 } from '@noble/hashes/sha256';
import { bytesToHex } from '@noble/hashes/utils';
import * as SecureStore from 'expo-secure-store';
import { env } from '@/config/env';
import { resetAnalyticsUser } from '@/lib/analytics';
import apiClient from './client';
import { AppError, normalizeError } from './errors';
import { getDevAuth } from './generated/dev-auth/dev-auth';
import type { AuthLoginResponse } from './generated/model';

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

const persistLoginResponse = async (data: AuthLoginResponse): Promise<OAuthLoginResponse> => {
  if (data.id == null || !data.accessToken || !data.refreshToken) {
    throw new Error('로그인 응답이 올바르지 않습니다.');
  }

  await SecureStore.setItemAsync('accessTokenKey', data.accessToken);
  await SecureStore.setItemAsync('refreshTokenKey', data.refreshToken);
  await SecureStore.setItemAsync('currentUserId', String(data.id));

  return {
    id: data.id,
    displayName: data.displayName ?? '',
    profileImageUrl: data.profileImageUrl ?? null,
    accessToken: data.accessToken,
    refreshToken: data.refreshToken,
    isNewUser: data.isNewUser ?? false,
  };
};

function generateNonce(length = 32): string {
  const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~';
  let nonce = '';
  for (let i = 0; i < length; i++) {
    nonce += charset[Math.floor(Math.random() * charset.length)];
  }
  return nonce;
}

export async function loginWithApple(): Promise<OAuthLoginResponse> {
  const isAvailable = await AppleAuthentication.isAvailableAsync();
  if (!isAvailable) {
    throw new Error('Apple 로그인은 iOS 기기에서만 사용할 수 있습니다.');
  }

  const rawNonce = generateNonce();
  const hashedNonce = bytesToHex(sha256(rawNonce));

  const credential = await AppleAuthentication.signInAsync({
    requestedScopes: [
      AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
      AppleAuthentication.AppleAuthenticationScope.EMAIL,
    ],
    nonce: hashedNonce,
  });

  if (!credential.identityToken) {
    throw new Error('Apple 로그인에 실패했습니다. identity token을 받지 못했어요.');
  }

  if (!credential.authorizationCode) {
    throw new Error('Apple 로그인에 실패했습니다. authorization code를 받지 못했어요.');
  }

  const familyName = credential.fullName?.familyName ?? '';
  const givenName = credential.fullName?.givenName ?? '';
  const displayName = (familyName + givenName).trim() || undefined;

  const { data } = await apiClient.post<AuthLoginResponse>('/auth/social/apple', {
    identityToken: credential.identityToken,
    rawNonce,
    authorizationCode: credential.authorizationCode,
    displayName,
  });

  return persistLoginResponse(data);
}

export async function loginWithKakao(): Promise<OAuthLoginResponse> {
  const kakaoToken: KakaoOAuthToken = await login();

  const { data } = await apiClient.post<AuthLoginResponse>('/auth/social/kakao', {
    providerAccessToken: kakaoToken.accessToken,
  });

  return persistLoginResponse(data);
}

export async function loginWithTestUser(testUserKey: string): Promise<OAuthLoginResponse> {
  if (env.appEnv !== 'development') {
    throw new Error('테스트 로그인은 개발 환경에서만 사용할 수 있습니다.');
  }

  const data = await getDevAuth().testLogin({ testUserKey });

  return persistLoginResponse(data);
}

export async function refreshAccessToken(): Promise<ServerResponseTokens> {
  const refreshToken = await SecureStore.getItemAsync('refreshTokenKey');
  if (!refreshToken) {
    await clearAuthSession();
    throw AppError({ type: 'auth', message: '다시 로그인해 주세요.' });
  }

  try {
    const { data } = await apiClient.post<ServerResponseTokens>(
      '/auth/refresh',
      {
        refreshToken,
      },
      {
        skipAuth: true,
        skipAuthRefresh: true,
      }
    );

    const { accessToken, refreshToken: updatedRefreshToken } = data;
    if (!accessToken || !updatedRefreshToken) {
      throw AppError({ type: 'auth', message: '토큰 재발급 응답이 올바르지 않습니다.' });
    }

    await SecureStore.setItemAsync('accessTokenKey', accessToken);
    await SecureStore.setItemAsync('refreshTokenKey', updatedRefreshToken);

    return data;
  } catch (error) {
    await clearAuthSession();
    const appError = normalizeError(error);
    throw AppError({
      type: 'auth',
      message: '다시 로그인해 주세요.',
      originalError: appError,
    });
  }
}

export async function clearAuthSession(): Promise<void> {
  await SecureStore.deleteItemAsync('refreshTokenKey');
  await SecureStore.deleteItemAsync('accessTokenKey');
  await SecureStore.deleteItemAsync('currentUserId');
  resetAnalyticsUser();
}

export async function logout(): Promise<void> {
  const refreshToken = await SecureStore.getItemAsync('refreshTokenKey');

  try {
    if (refreshToken) {
      await apiClient.post(
        '/auth/logout',
        {
          refreshToken,
        },
        {
          skipAuth: true,
          skipAuthRefresh: true,
        }
      );
    }
  } catch {
    // 서버 로그아웃 실패와 무관하게 기기 내 세션은 정리한다.
  } finally {
    await clearAuthSession();
  }
}
