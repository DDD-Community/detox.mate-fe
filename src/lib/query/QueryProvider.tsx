import { QueryClientProvider } from '@tanstack/react-query';
import { useEffect, type ReactNode } from 'react';

import { restoreAuthSession, useAuthSessionStore } from '../../stores/authSessionStore';
import { queryClient } from './queryClient';

export function QueryProvider({ children }: { children: ReactNode }) {
  useEffect(() => {
    const unsubscribe = useAuthSessionStore.subscribe((next, previous) => {
      if (previous.scope && next.scope !== previous.scope) {
        queryClient.removeQueries({
          queryKey: ['auth', previous.scope.sessionId, previous.scope.userId],
        });
      }
    });
    void restoreAuthSession();
    return unsubscribe;
  }, []);
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}
