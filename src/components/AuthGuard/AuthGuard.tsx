import { QueryErrorResetBoundary, useSuspenseQuery } from '@tanstack/react-query';
import { Suspense, type PropsWithChildren } from 'react';
import { ActivityIndicator, View } from 'react-native';

import { getMyProfileQueryOptions } from '@/api/userQueries';
import { useAuthSessionStore } from '@/stores/authSessionStore';
import { ErrorBoundary } from '../AppErrorBoundary/AppErrorBoundary';

function VerifiedAccount({ children }: PropsWithChildren) {
  const { error, isFetching } = useSuspenseQuery(getMyProfileQueryOptions());
  if (error && !isFetching) throw error;
  return children;
}

export function AuthGuard({ children }: PropsWithChildren) {
  const status = useAuthSessionStore((state) => state.status);
  if (status !== 'authenticated') return null;

  return (
    <QueryErrorResetBoundary>
      {({ reset }) => (
        <ErrorBoundary onReset={reset}>
          <Suspense
            fallback={
              <View style={{ flex: 1, justifyContent: 'center' }}>
                <ActivityIndicator accessibilityLabel="로그인 정보 확인 중" />
              </View>
            }
          >
            <VerifiedAccount>{children}</VerifiedAccount>
          </Suspense>
        </ErrorBoundary>
      )}
    </QueryErrorResetBoundary>
  );
}
