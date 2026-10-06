import * as SecureStore from 'expo-secure-store';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useState, type ReactNode } from 'react';

import { AppErrorBoundary } from '../../components/AppErrorBoundary';
import { getAuthQueryScope, restoreAuthQueryScope } from './authQueryScope';

export function AuthSessionBootstrap({ children }: { children: ReactNode }) {
  return (
    <AppErrorBoundary>
      <RestoreSession>{children}</RestoreSession>
    </AppErrorBoundary>
  );
}

function RestoreSession({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<unknown>(null);

  useEffect(() => {
    let active = true;
    const initial = getAuthQueryScope();
    const restore = async () => {
      try {
        if (initial.userId === null && initial.version === 0) {
          const [accessToken, userId] = await Promise.all([
            SecureStore.getItemAsync('accessTokenKey'),
            SecureStore.getItemAsync('currentUserId'),
          ]);
          if (active && accessToken && userId) restoreAuthQueryScope(userId, initial);
        }
      } catch (failure) {
        if (active && getAuthQueryScope() === initial) setError(failure);
      } finally {
        if (active) {
          setReady(true);
          void SplashScreen.hideAsync().catch((failure) => {
            if (active) setError(failure);
          });
        }
      }
    };
    void restore();
    return () => {
      active = false;
    };
  }, []);

  if (error) throw error;
  return ready ? children : null;
}
