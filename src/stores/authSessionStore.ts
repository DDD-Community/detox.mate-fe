import { withAuthStorage } from '../lib/authStorage';
import * as SecureStore from 'expo-secure-store';
import { create } from 'zustand';

export type AuthScope = { userId: number; sessionId: number };
let sessionId = 0;

export const useAuthSessionStore = create<{
  ready: boolean;
  scope: AuthScope | null;
}>(() => ({ ready: false, scope: null }));

// Invalidate the old scope before async persistence or deletion starts.
export function beginAuthTransition(): number {
  const transition = ++sessionId;
  useAuthSessionStore.setState({ ready: false, scope: null });
  return transition;
}

export function completeAuthTransition(transition: number, userId: number | null): void {
  if (transition !== sessionId) return;
  useAuthSessionStore.setState({
    ready: true,
    scope: userId == null ? null : { userId, sessionId: transition },
  });
}

export const getAuthSessionRevision = () => sessionId;

export function isCurrentAuthScope(scope: AuthScope): boolean {
  return useAuthSessionStore.getState().scope === scope;
}

let restoration: Promise<void> | undefined;
export function restoreAuthSession(): Promise<void> {
  if (useAuthSessionStore.getState().ready) return Promise.resolve();
  restoration ??= (async () => {
    const transition = sessionId;
    try {
      const [storedId, accessToken] = await withAuthStorage(() =>
        Promise.all([
          SecureStore.getItemAsync('currentUserId'),
          SecureStore.getItemAsync('accessTokenKey'),
        ])
      );
      if (useAuthSessionStore.getState().ready) return;
      const id = storedId == null ? NaN : Number(storedId);
      completeAuthTransition(
        transition,
        accessToken && Number.isSafeInteger(id) && id > 0 ? id : null
      );
    } catch {
      // SecureStore cannot recover the authenticated scope: keep protected queries unmounted.
      completeAuthTransition(transition, null);
    }
  })();
  return restoration;
}
