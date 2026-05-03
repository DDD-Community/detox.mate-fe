import * as SecureStore from 'expo-secure-store';
import { useRouter } from 'expo-router';
import { useEffect } from 'react';
import { Image, StyleSheet, View } from 'react-native';

export default function SplashScreen() {
  const router = useRouter();

  useEffect(() => {
    const redirect = async () => {
      await new Promise((resolve) => setTimeout(resolve, 1000));

      const accessToken = await SecureStore.getItemAsync('accessTokenKey');
      if (!accessToken) {
        router.replace('/login');
        return;
      }

      const isNewUser = await SecureStore.getItemAsync('isNewUser');
      if (isNewUser !== 'true') {
        router.replace('/login');
        return;
      }

      router.replace('/home');
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
