import { useRouter } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import { useEffect } from 'react';
import { Image, StyleSheet, View } from 'react-native';

export default function SplashScreen() {
  const router = useRouter();

  useEffect(() => {
    const redirect = async () => {
      const [accessToken] = await Promise.all([
        SecureStore.getItemAsync('accessTokenKey'),
        new Promise((resolve) => setTimeout(resolve, 1000)),
      ]);
      router.replace(accessToken ? '/home' : '/login');
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
