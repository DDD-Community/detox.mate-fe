import * as Notifications from 'expo-notifications';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

import { getFcmToken } from '../api/generated/fcm-token/fcm-token';
import { RegisterFcmTokenRequestPlatform } from '../api/generated/model';

const STORED_TOKEN_KEY = 'fcmDeviceTokenKey';

const getCurrentUserParam = async () => {
  const userIdStr = await SecureStore.getItemAsync('currentUserId');
  return { currentUser: { id: userIdStr ? Number(userIdStr) : undefined } };
};

const getPlatform = (): RegisterFcmTokenRequestPlatform => {
  if (Platform.OS === 'ios') return RegisterFcmTokenRequestPlatform.IOS;
  if (Platform.OS === 'android') return RegisterFcmTokenRequestPlatform.ANDROID;
  return RegisterFcmTokenRequestPlatform.WEB;
};

/**
 * 디바이스 푸시 토큰을 발급받아 서버에 등록.
 * 푸시 권한이 없거나 토큰 발급에 실패하면 조용히 종료.
 * 마지막으로 등록한 토큰은 unregister에 사용하기 위해 SecureStore에 보관.
 */
export async function registerDevicePushToken(): Promise<void> {
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

  await getFcmToken().register(
    { token, platform: getPlatform() },
    await getCurrentUserParam(),
  );
  await SecureStore.setItemAsync(STORED_TOKEN_KEY, token);
}

/**
 * 마지막으로 등록한 디바이스 푸시 토큰을 서버에서 제거.
 * 보관된 토큰이 없으면 noop.
 */
export async function unregisterDevicePushToken(): Promise<void> {
  const token = await SecureStore.getItemAsync(STORED_TOKEN_KEY);
  if (!token) return;
  try {
    await getFcmToken().remove({ token }, await getCurrentUserParam());
  } finally {
    await SecureStore.deleteItemAsync(STORED_TOKEN_KEY);
  }
}
