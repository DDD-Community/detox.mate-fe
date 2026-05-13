import * as SecureStore from 'expo-secure-store';
import { useRouter } from 'expo-router';
import { useEffect } from 'react';
import { Image, StyleSheet, View } from 'react-native';
import apiClient from '../api/client';

export default function SplashScreen() {
  const router = useRouter();

  useEffect(() => {
    const redirect = async () => {
      await new Promise((resolve) => setTimeout(resolve, 1000));

      const onboardingDone = await SecureStore.getItemAsync('onboardingDone');
      if (onboardingDone !== 'true') {
        router.replace('/onboarding');
        return;
      }

      const accessToken = await SecureStore.getItemAsync('accessTokenKey');
      if (!accessToken) {
        router.replace('/login');
        return;
      }

      try {
        const res = await apiClient.get<any[]>('/me/groups');
        const groups = res.data;

        if (groups.length === 0) {
          router.replace('/home');
          return;
        }

        const group = groups[0];
        if (group.members.length >= 2) {
          router.replace('/home');
        } else {
          router.replace(
            `/feed?groupName=${encodeURIComponent(group.name)}&inviteCode=${encodeURIComponent(group.inviteCode)}`
          );
        }
      } catch {
        router.replace('/home');
      }
    };
    redirect();
  }, []);

  return (
    <View style={styles.container}>
      <Image
        source={require('../../assets/images/splash.png')}
        style={styles.image}
        resizeMode="contain"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  image: {
    width: '100%',
    height: '100%',
  },
});
