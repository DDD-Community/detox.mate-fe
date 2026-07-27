import * as SecureStore from 'expo-secure-store';

/**
 * Airbridge 딥링크로 들어온 초대 코드를 잠시 보관하는 저장소.
 *
 * 콜드 스타트 시 딥링크 콜백과 SplashScreen 라우팅이 경합하면서 초대 화면
 * 이동이 덮어써지는 문제를 막기 위해, 코드를 즉시 저장해 두고 라우팅 결정을
 * SplashScreen(및 로그인 완료 시점)으로 일원화한다.
 *
 * 미로그인 유저가 로그인 절차(카카오/애플 OAuth로 앱이 잠시 백그라운드로
 * 전환될 수 있음)를 거치는 동안에도 값이 유지되도록 SecureStore에 보관한다.
 */
const PENDING_INVITE_CODE_KEY = 'pendingInviteCode';

export async function setPendingInviteCode(code: string): Promise<void> {
  try {
    await SecureStore.setItemAsync(PENDING_INVITE_CODE_KEY, code);
  } catch {
    // 저장 실패가 딥링크 흐름을 막지 않도록 무시한다.
  }
}

/** 값을 읽되 삭제하지 않는다. (미로그인 → 로그인 이동 시 코드 보존용) */
export async function peekPendingInviteCode(): Promise<string | null> {
  try {
    return await SecureStore.getItemAsync(PENDING_INVITE_CODE_KEY);
  } catch {
    return null;
  }
}

/** 값을 읽고 즉시 삭제한다. (초대 화면으로 실제 이동하는 시점에 사용) */
export async function consumePendingInviteCode(): Promise<string | null> {
  try {
    const code = await SecureStore.getItemAsync(PENDING_INVITE_CODE_KEY);
    if (code) {
      await SecureStore.deleteItemAsync(PENDING_INVITE_CODE_KEY);
    }
    return code;
  } catch {
    return null;
  }
}

export async function clearPendingInviteCode(): Promise<void> {
  try {
    await SecureStore.deleteItemAsync(PENDING_INVITE_CODE_KEY);
  } catch {
    // 무시
  }
}
