import * as SecureStore from 'expo-secure-store';
import { useRouter } from 'expo-router';
import { useEffect } from 'react';
import { Image, StyleSheet, View } from 'react-native';

import { logError, normalizeError } from '../api/errors';
import { getGroup } from '../api/generated/group/group';
import { getGroupChallenge } from '../api/generated/group-challenge/group-challenge';
import { LoggingPage } from '../components';
import { trackEvent } from '../lib/analytics';
import { consumePendingInviteCode } from '../lib/pendingInvite';
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
      trackEvent('App Opened');
      await new Promise((resolve) => setTimeout(resolve, 1000));

      const accessToken = await SecureStore.getItemAsync('accessTokenKey');
      if (cancelled) return;

      if (!accessToken) {
        // 미로그인 상태에서는 대기 중인 초대 코드를 소비하지 않고 보존한다.
        // 로그인 성공 후(useAuthLogin) 코드를 읽어 초대 화면으로 연결한다.
        const termsAccepted = await SecureStore.getItemAsync(TERMS_ACCEPTED_KEY);
        if (cancelled) return;
        router.replace(termsAccepted === 'true' ? '/login' : '/onboarding');
        return;
      }

      // 로그인된 상태에서 딥링크로 들어온 초대 코드가 있으면 초대 화면으로 우선 연결한다.
      const pendingInviteCode = await consumePendingInviteCode();
      if (cancelled) return;
      if (pendingInviteCode) {
        router.replace({
          pathname: '/(group)/join',
          params: { inviteCode: pendingInviteCode },
        });
        return;
      }

      try {
        const feedRouteParams = await getInitialFeedRouteParams();
        if (cancelled) return;

        if (feedRouteParams == null) {
          router.replace('/(group)/home');
          return;
        }

        router.replace({
          pathname: '/(feed)/home',
          params: feedRouteParams,
        });
      } catch (error) {
        if (cancelled) return;

        logError(normalizeError(error), {
          scope: 'app.bootstrap',
          operation: 'resolveInitialRoute',
        });

        const currentAccessToken = await SecureStore.getItemAsync('accessTokenKey');
        if (cancelled) return;

        if (!currentAccessToken) {
          router.replace({ pathname: '/login', params: { reason: 'sessionExpired' } });
        } else {
          router.replace('/(group)/home');
        }
      }
    };
    redirect();

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
    width: 152,
    height: 152,
  },
});
