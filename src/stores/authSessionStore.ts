import * as SecureStore from 'expo-secure-store';
import { create } from 'zustand';

type AuthStatus = 'restoring' | 'authenticated' | 'unauthenticated';

// 토큰은 SecureStore에만 두고, 화면 접근 가능 여부만 구독한다.
export const useAuthSessionStore = create<{ status: AuthStatus }>(() => ({ status: 'restoring' }));

export async function restoreAuthSession() {
  if (useAuthSessionStore.getState().status !== 'restoring') return;
  const token = await SecureStore.getItemAsync('accessTokenKey');
  // 복원 중 로그인/로그아웃이 일어났다면 오래된 저장소 응답을 적용하지 않는다.
  if (useAuthSessionStore.getState().status !== 'restoring') return;
  useAuthSessionStore.setState({ status: token ? 'authenticated' : 'unauthenticated' });
}
