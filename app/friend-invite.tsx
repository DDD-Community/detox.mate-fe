import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';

import { AuthGuard } from '@/components/AuthGuard/AuthGuard';
import { useAuthStatus } from '@/api/auth';
import { logError, normalizeError } from '@/api/errors';
import { ErrorBoundary } from '@/components/AppErrorBoundary/AppErrorBoundary';
import { LoggingPage } from '@/components/LoggingPage/LoggingPage';
import { setPendingInvite } from '@/lib/pendingInvite';
import FriendInviteScreen, {
  UnusableFriendInvite,
} from '@/screens/friends/pages/FriendInviteScreen';

function AuthenticatedInvite({ code }: { code: string }) {
  const isSignedIn = useAuthStatus() === 'signedIn';
  const [error, setError] = useState<Error | null>(null);
  useEffect(() => {
    let active = true;
    const restore = async () => {
      try {
        if (!isSignedIn) {
          await setPendingInvite({ kind: 'friend', code });
          if (active) router.replace('/');
        }
      } catch (failure) {
        const normalized = normalizeError(failure);
        logError(normalized, { scope: 'app.bootstrap', operation: 'restoreFriendInviteSession' });
        if (active) setError(normalized);
      }
    };
    void restore();
    return () => {
      active = false;
    };
  }, [code, isSignedIn]);
  if (error) throw error;
  if (!isSignedIn) {
    return (
      <View style={{ flex: 1, backgroundColor: 'white', justifyContent: 'center' }}>
        <ActivityIndicator color="#5a8974" accessibilityLabel="로그인 정보 확인 중" />
      </View>
    );
  }
  return (
    <AuthGuard>
      <FriendInviteScreen code={code} />
    </AuthGuard>
  );
}

export default function FriendInviteRoute() {
  const { code } = useLocalSearchParams<{ code?: string | string[] }>();
  const [attempt, setAttempt] = useState(0);
  return (
    <LoggingPage
      eventName="Friend Invite Viewed"
      properties={{ pageName: 'FriendInvite', entry_point: 'invite_link' }}
    >
      {typeof code !== 'string' || !code.trim() ? (
        <UnusableFriendInvite />
      ) : (
        <ErrorBoundary key={`${code}:${attempt}`} onReset={() => setAttempt((value) => value + 1)}>
          <AuthenticatedInvite code={code} />
        </ErrorBoundary>
      )}
    </LoggingPage>
  );
}
