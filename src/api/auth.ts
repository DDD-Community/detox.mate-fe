import { KakaoOAuthToken, login } from '@react-native-seoul/kakao-login';
import * as AppleAuthentication from 'expo-apple-authentication';
import { sha256 } from '@noble/hashes/sha256';
import { bytesToHex } from '@noble/hashes/utils';
import * as SecureStore from 'expo-secure-store';
import apiClient from './client';
import { AppError, normalizeError } from './errors';
import { getDevAuth } from './generated/dev-auth/dev-auth';
import type { AuthLoginResponse } from './generated/model';

// 현재 세션이 (앱스토어 심사용) 테스트 계정 로그인인지 기록하는 키.
// 토큰과 같은 SecureStore에 두어 앱 재시작 후에도 세션과 수명을 함께한다.
const IS_TEST_ACCOUNT_KEY = 'isTestAccount';

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

const persistLoginResponse = async (
  data: AuthLoginResponse,
  options: { isTestAccount?: boolean } = {}
): Promise<OAuthLoginResponse> => {
  if (data.id == null || !data.accessToken || !data.refreshToken) {
    throw new Error('로그인 응답이 올바르지 않습니다.');
  }

  await SecureStore.setItemAsync('accessTokenKey', data.accessToken);
  await SecureStore.setItemAsync('refreshTokenKey', data.refreshToken);
  await SecureStore.setItemAsync('currentUserId', String(data.id));

  // 테스트 계정 여부를 기록한다. 일반 로그인(카카오/애플)에서는 반드시 제거해
  // 실제 유저가 이전 테스트 세션의 플래그를 물려받지 않도록 한다.
  if (options.isTestAccount) {
    await SecureStore.setItemAsync(IS_TEST_ACCOUNT_KEY, 'true');
  } else {
    await SecureStore.deleteItemAsync(IS_TEST_ACCOUNT_KEY);
  }

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
  // 앱스토어 심사를 위해 prod 빌드에서도 테스트 로그인을 허용한다.
  // 진입은 로그인 화면의 숨김 제스처(거북이 5탭)로만 가능하다.
  const data = await getDevAuth().testLogin({ testUserKey });

  return persistLoginResponse(data, { isTestAccount: true });
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
  await SecureStore.deleteItemAsync(IS_TEST_ACCOUNT_KEY);
}

// 현재 로그인 세션이 테스트 계정인지 여부. 스크린타임 OCR 검증 우회 등
// 심사용 분기에서 사용한다.
export async function isTestAccountSession(): Promise<boolean> {
  const value = await SecureStore.getItemAsync(IS_TEST_ACCOUNT_KEY);
  return value === 'true';
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
