import { router, useLocalSearchParams } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';

import { logError, normalizeError } from '@/api/errors';
import { ErrorBoundary } from '@/components/AppErrorBoundary/AppErrorBoundary';
import { LoggingPage } from '@/components/LoggingPage/LoggingPage';
import { setPendingInvite } from '@/lib/pendingInvite';
import FriendInviteScreen, {
  UnusableFriendInvite,
} from '@/screens/friends/pages/FriendInviteScreen';

function AuthenticatedInvite({ code }: { code: string }) {
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  useEffect(() => {
    let active = true;
    const restore = async () => {
      try {
        const token = await SecureStore.getItemAsync('accessTokenKey');
        if (!active) return;
        if (token) {
          setReady(true);
        } else {
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
  }, [code]);
  if (error) throw error;
  if (!ready) {
    return (
      <View style={{ flex: 1, backgroundColor: 'white', justifyContent: 'center' }}>
        <ActivityIndicator color="#5a8974" accessibilityLabel="로그인 정보 확인 중" />
      </View>
    );
  }
  return <FriendInviteScreen code={code} />;
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
