import { loginWithKakao } from '../auth/kakaoLogin';
import { useRouter } from 'expo-router';
import { Button, StyleSheet, View } from 'react-native';

export default function LoginScreen() {
  const router = useRouter();

  const handleKakaoLogin = async () => {
    await loginWithKakao();
    router.replace('/home');
  };

  return (
    <View style={styles.container}>
      <Button title="카카오 로그인" onPress={handleKakaoLogin} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
