import { useRouter } from 'expo-router';
import { useEffect } from 'react';
import { Image, StyleSheet, View } from 'react-native';

export default function SplashScreen() {
  const router = useRouter();

  useEffect(() => {
    const redirect = async () => {
      // 온보딩 플로우: 저장된 토큰 유무와 관계없이 항상 로그인 화면으로 이동.
      // 약관 동의 및 신규 회원 플로우 완성 후 토큰 체크를 복원한다.
      await new Promise((resolve) => setTimeout(resolve, 1000));
      router.replace('/login');
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
