import * as Notifications from 'expo-notifications';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

import { getFcmToken } from '../api/generated/fcm-token/fcm-token';
import { RegisterFcmTokenRequestPlatform } from '../api/generated/model';

const STORED_TOKEN_KEY = 'fcmDeviceTokenKey';
let devicePushTokenRegistrationPromise: Promise<void> | null = null;
const tokenRegistrationPromises = new Map<string, Promise<void>>();

const getUserParam = async () => {
  const userIdStr = await SecureStore.getItemAsync('currentUserId');
  return { user: { id: userIdStr ? Number(userIdStr) : undefined } };
};

const getPlatform = (): RegisterFcmTokenRequestPlatform => {
  if (Platform.OS === 'ios') return RegisterFcmTokenRequestPlatform.IOS;
  if (Platform.OS === 'android') return RegisterFcmTokenRequestPlatform.ANDROID;
  return RegisterFcmTokenRequestPlatform.WEB;
};

const registerTokenIfNeeded = async (token: string): Promise<void> => {
  const stored = await SecureStore.getItemAsync(STORED_TOKEN_KEY);
  if (stored === token) return;

  const existing = tokenRegistrationPromises.get(token);
  if (existing) return existing;

  const promise = (async () => {
    await getFcmToken().register({ token, platform: getPlatform() }, await getUserParam());
    await SecureStore.setItemAsync(STORED_TOKEN_KEY, token);
  })().finally(() => {
    tokenRegistrationPromises.delete(token);
  });
  tokenRegistrationPromises.set(token, promise);
  return promise;
};

/**
 * 디바이스 푸시 토큰을 발급받아 서버에 등록.
 * 푸시 권한이 없거나 토큰 발급에 실패하면 조용히 종료.
 * 마지막으로 등록한 토큰은 unregister에 사용하기 위해 SecureStore에 보관.
 */
export async function registerDevicePushToken(): Promise<void> {
  if (devicePushTokenRegistrationPromise) return devicePushTokenRegistrationPromise;

  devicePushTokenRegistrationPromise = (async () => {
    const { status } = await Notifications.getPermissionsAsync();
    if (status !== 'granted') return;

    let token: string | undefined;
    try {
      const response = await Notifications.getDevicePushTokenAsync();
      token = typeof response?.data === 'string' ? response.data : undefined;
    } catch {
      return;
    }
    if (!token) return;

    await registerTokenIfNeeded(token);
  })().finally(() => {
    devicePushTokenRegistrationPromise = null;
  });

  return devicePushTokenRegistrationPromise;
}

/**
 * 마지막으로 등록한 디바이스 푸시 토큰을 서버에서 제거.
 * 보관된 토큰이 없으면 noop.
 */
export async function unregisterDevicePushToken(): Promise<void> {
  await devicePushTokenRegistrationPromise?.catch(() => undefined);
  await Promise.allSettled(Array.from(tokenRegistrationPromises.values()));

  const token = await SecureStore.getItemAsync(STORED_TOKEN_KEY);
  if (!token) return;
  try {
    await getFcmToken().remove({ token }, await getUserParam());
  } finally {
    await SecureStore.deleteItemAsync(STORED_TOKEN_KEY);
  }
}

/**
 * 아직 등록된 토큰이 없으면 한 번 register 호출. 이미 등록되어 있으면 noop.
 * 시스템 권한이 OS 설정에서 새로 허용된 경우 등 "초기 등록 실패 → 사후 보정" 시나리오에서 사용.
 */
export async function ensureDevicePushTokenRegistered(): Promise<void> {
  const stored = await SecureStore.getItemAsync(STORED_TOKEN_KEY);
  if (stored) return;
  await registerDevicePushToken();
}

/**
 * 푸시 토큰 리스너가 발급해준 새 토큰을 처리.
 * 로그인 상태가 아니거나, 권한이 없거나, 보관된 토큰과 동일하면 noop.
 */
export async function handleNewDevicePushToken(token: string): Promise<void> {
  if (!token) return;
  const accessToken = await SecureStore.getItemAsync('accessTokenKey');
  if (!accessToken) return;

  const { status } = await Notifications.getPermissionsAsync();
  if (status !== 'granted') return;

  const stored = await SecureStore.getItemAsync(STORED_TOKEN_KEY);
  if (stored === token) return;

  await registerTokenIfNeeded(token);
}
