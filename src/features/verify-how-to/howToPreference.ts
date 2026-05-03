import * as SecureStore from 'expo-secure-store';

const CURRENT_USER_ID_KEY = 'currentUserId';
const HIDE_VERIFY_HOW_TO_PREFIX = 'hideVerifyHowTo_';

async function getCurrentUserId(): Promise<string | null> {
  return SecureStore.getItemAsync(CURRENT_USER_ID_KEY);
}

export async function isVerifyHowToHidden(): Promise<boolean> {
  const userId = await getCurrentUserId();
  if (!userId) return false;
  const value = await SecureStore.getItemAsync(`${HIDE_VERIFY_HOW_TO_PREFIX}${userId}`);
  return value === '1';
}

export async function setVerifyHowToHidden(): Promise<void> {
  const userId = await getCurrentUserId();
  if (!userId) return;
  await SecureStore.setItemAsync(`${HIDE_VERIFY_HOW_TO_PREFIX}${userId}`, '1');
}
