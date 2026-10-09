import * as SecureStore from 'expo-secure-store';
import { useRouter } from 'expo-router';
import { useEffect } from 'react';
import { Image, StyleSheet, View } from 'react-native';

import { logError, normalizeError } from '../api/errors';
import { getGroup } from '../api/generated/group/group';
import { getGroupChallenge } from '../api/generated/group-challenge/group-challenge';
import { LoggingPage } from '../components';
import { setAnalyticsUserId, trackEvent } from '../lib/analytics';
import { navigateAuthenticated } from '../lib/inviteDestination';
import { TERMS_ACCEPTED_KEY } from './auth/authStorageKeys';

type InitialFeedRouteParams = {
  groupChallengeId?: string;
  groupName?: string;
  inviteCode?: string;
};

const getInitialFeedRouteParams = async (): Promise<InitialFeedRouteParams | null> => {
  const groups = await getGroup().getMyGroups();
  const firstGroup = groups[0];

  if (!firstGroup) {
    return null;
  }

  const baseParams = {
    ...(firstGroup.name ? { groupName: firstGroup.name } : {}),
    ...(firstGroup.inviteCode ? { inviteCode: firstGroup.inviteCode } : {}),
  };

  if (firstGroup.currentChallenge?.id != null) {
    return {
      ...baseParams,
      groupChallengeId: String(firstGroup.currentChallenge.id),
    };
  }

  const challenges = await getGroupChallenge().getMyGroupChallenges();
  const firstChallengeId = challenges[0]?.id;
  return {
    ...baseParams,
    ...(firstChallengeId != null ? { groupChallengeId: String(firstChallengeId) } : {}),
  };
};

export default function SplashScreen() {
  const router = useRouter();

  useEffect(() => {
    let cancelled = false;

    const redirect = async () => {
      const accessToken = await SecureStore.getItemAsync('accessTokenKey');
      const currentUserId = await SecureStore.getItemAsync('currentUserId');
      if (cancelled) return;

      if (accessToken && currentUserId) {
        setAnalyticsUserId(currentUserId);
      }

      trackEvent('App Opened');
      if (!accessToken) {
        // 미로그인 상태에서는 대기 중인 초대 코드를 소비하지 않고 보존한다.
        // 로그인 성공 후(useAuthLogin) 코드를 읽어 초대 화면으로 연결한다.
        const termsAccepted = await SecureStore.getItemAsync(TERMS_ACCEPTED_KEY);
        if (cancelled) return;
        router.replace(termsAccepted === 'true' ? '/login' : '/onboarding');
        return;
      }

      await navigateAuthenticated({
        replace: (destination) => router.replace(destination),
        isActive: () => !cancelled,
        resolveDefault: async () => {
          try {
            const params = await getInitialFeedRouteParams();
            return params == null ? '/(group)/home' : { pathname: '/(feed)/home', params };
          } catch (error) {
            if (!cancelled) {
              logError(normalizeError(error), {
                scope: 'app.bootstrap',
                operation: 'resolveInitialRoute',
              });
            }
            return '/(group)/home';
          }
        },
      });
    };
    void redirect().catch((error) => {
      if (cancelled) return;
      logError(normalizeError(error), { scope: 'app.bootstrap', operation: 'restoreInitialRoute' });
      router.replace('/login');
    });

    return () => {
      cancelled = true;
    };
  }, [router]);

  return (
    <LoggingPage eventName="Splash Viewed" properties={{ pageName: 'Splash' }}>
      <View style={styles.container}>
        <Image
          source={require('../../assets/splash_logo.png')}
          style={styles.image}
          resizeMode="contain"
        />
      </View>
    </LoggingPage>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1D9E75',
    alignItems: 'center',
    justifyContent: 'center',
  },
  image: {
    width: '100%',
    aspectRatio: 153 / 68,
  },
});
