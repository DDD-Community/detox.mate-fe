import * as SecureStore from 'expo-secure-store';
import { useRouter } from 'expo-router';
import { useEffect } from 'react';
import { Image, StyleSheet, View } from 'react-native';

import { logError, normalizeError } from '../api/errors';
import { LoggingPage } from '../components';
import { setAnalyticsUserId, trackEvent } from '../lib/analytics';
import { useAuthSessionStore } from '../stores/authSessionStore';
import { navigateAuthenticated } from '../lib/inviteDestination';

export default function SplashScreen() {
  const router = useRouter();
  const isAuthenticated = useAuthSessionStore((state) => state.status === 'authenticated');

  useEffect(() => {
    let cancelled = false;

    const redirect = async () => {
      const currentUserId = await SecureStore.getItemAsync('currentUserId');
      if (cancelled) return;

      if (isAuthenticated && currentUserId) {
        setAnalyticsUserId(currentUserId);
      }

      trackEvent('App Opened');
      if (!isAuthenticated) {
        router.replace('/login');
        return;
      }

      await navigateAuthenticated({
        replace: (destination) => router.replace(destination),
        isActive: () => !cancelled,
        resolveDefault: async () => '/(tabs)/restricted-apps',
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
  }, [router, isAuthenticated]);

  return (
    <LoggingPage eventName="Splash Viewed" properties={{ pageName: 'Splash' }}>
      <View style={styles.container}>
        <Image
          source={require('../../assets/onboarding/splash.png')}
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
    backgroundColor: '#5A8974',
    alignItems: 'center',
    justifyContent: 'center',
  },
  image: {
    width: 178.775,
    height: 214,
  },
});
