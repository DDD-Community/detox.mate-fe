import * as SecureStore from 'expo-secure-store';
import { useRouter } from 'expo-router';
import { useEffect } from 'react';
import { Image, StyleSheet, View } from 'react-native';

import { getGroup } from '../api/generated/group/group';
import { getGroupChallenge } from '../api/generated/group-challenge/group-challenge';
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
      await new Promise((resolve) => setTimeout(resolve, 1000));

      const accessToken = await SecureStore.getItemAsync('accessTokenKey');
      if (cancelled) return;

      if (!accessToken) {
        const termsAccepted = await SecureStore.getItemAsync(TERMS_ACCEPTED_KEY);
        if (cancelled) return;
        router.replace(termsAccepted === 'true' ? '/login' : '/onboarding');
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
      } catch {
        if (cancelled) return;

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
    <View style={styles.container}>
      <Image
        source={require('../../assets/splash_logo.png')}
        style={styles.image}
        resizeMode="contain"
      />
    </View>
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
