import * as SecureStore from 'expo-secure-store';
import { useRouter } from 'expo-router';
import { useEffect } from 'react';
import { Image, StyleSheet, View } from 'react-native';

import { TERMS_ACCEPTED_KEY } from './auth/authStorageKeys';

export default function SplashScreen() {
  const router = useRouter();

  useEffect(() => {
    const redirect = async () => {
      await new Promise((resolve) => setTimeout(resolve, 1000));

      const accessToken = await SecureStore.getItemAsync('accessTokenKey');
      if (!accessToken) {
        const termsAccepted = await SecureStore.getItemAsync(TERMS_ACCEPTED_KEY);
        router.replace(termsAccepted === 'true' ? '/login' : '/onboarding');
        return;
      }

      router.replace('/(group)/home');
    };
    redirect();
  }, []);

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
