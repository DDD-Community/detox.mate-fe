import { useStore } from 'zustand';
import { createStore } from 'zustand/vanilla';

export type AuthQueryScope = { userId: string | null; version: number };
const authQueryScopeStore = createStore<AuthQueryScope>(() => ({ userId: null, version: 0 }));

export const getAuthQueryScope = () => authQueryScopeStore.getState();
export const isCurrentAuthQueryScope = (candidate: AuthQueryScope) =>
  candidate === getAuthQueryScope();

export function changeAuthQueryScope(userId: string | null) {
  authQueryScopeStore.setState((scope) => ({ userId, version: scope.version + 1 }));
}

export function restoreAuthQueryScope(userId: string | null, initial: AuthQueryScope) {
  const scope = getAuthQueryScope();
  if (scope === initial && initial.version === 0 && scope.userId === null && userId !== null) {
    changeAuthQueryScope(userId);
  }
}

export function useAuthQueryScope() {
  return useStore(authQueryScopeStore);
}
