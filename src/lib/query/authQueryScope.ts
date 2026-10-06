import { useSyncExternalStore } from 'react';

export type AuthQueryScope = { userId: string | null; version: number };
let scope: AuthQueryScope = { userId: null, version: 0 };
const listeners = new Set<() => void>();

export const getAuthQueryScope = () => scope;
export const isCurrentAuthQueryScope = (candidate: AuthQueryScope) => candidate === scope;

export function changeAuthQueryScope(userId: string | null) {
  scope = { userId, version: scope.version + 1 };
  listeners.forEach((listener) => listener());
}

export function restoreAuthQueryScope(userId: string | null, initial: AuthQueryScope) {
  if (scope === initial && initial.version === 0 && scope.userId === null && userId !== null) {
    changeAuthQueryScope(userId);
  }
}

export function useAuthQueryScope() {
  return useSyncExternalStore((listener) => {
    listeners.add(listener);
    return () => listeners.delete(listener);
  }, getAuthQueryScope);
}
