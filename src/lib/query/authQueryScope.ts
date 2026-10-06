import { create } from 'zustand';

export type AuthQueryScope = { userId: string | null; version: number };
const useAuthQueryScopeStore = create<AuthQueryScope>(() => ({ userId: null, version: 0 }));

export const getAuthQueryScope = () => useAuthQueryScopeStore.getState();
export const isCurrentAuthQueryScope = (candidate: AuthQueryScope) =>
  candidate === getAuthQueryScope();

export function changeAuthQueryScope(userId: string | null) {
  useAuthQueryScopeStore.setState((scope) => ({ userId, version: scope.version + 1 }));
}

export function restoreAuthQueryScope(userId: string | null, initial: AuthQueryScope) {
  const scope = getAuthQueryScope();
  if (scope === initial && initial.version === 0 && scope.userId === null && userId !== null) {
    changeAuthQueryScope(userId);
  }
}

export function useAuthQueryScope() {
  return useAuthQueryScopeStore();
}
