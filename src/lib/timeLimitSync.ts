import * as SecureStore from 'expo-secure-store';

import { getTimeLimit } from '../api/generated/time-limit/time-limit';
import { useLockStore } from '../stores/lockStore';

/**
 * 앱 시작 시 서버에 저장된 제한 시간(/me/time-limit)을 로컬 store에 반영한다. 로그인 전이거나,
 * 서버에 아직 설정이 없거나(404), 네트워크가 실패하면 로컬 값을 그대로 둔다.
 */
export const syncTimeLimitFromServer = async () => {
  const accessToken = await SecureStore.getItemAsync('accessTokenKey');
  if (!accessToken) return;

  try {
    const { totalLockMinutes } = await getTimeLimit().get();
    if (typeof totalLockMinutes === 'number') {
      useLockStore.getState().confirmTargetMinutes(totalLockMinutes);
    }
  } catch {
    // 로컬 값 유지.
  }
};
