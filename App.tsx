import { Alert, Button, StyleSheet, View } from 'react-native';
import { signInWithKakao } from './auth/kakaoLogin';

export default function App() {
  const handleLogin = async () => {
    try {
      const result = await signInWithKakao();
      console.log('서비스 로그인 성공', result);
    } catch (error) {
      Alert.alert('로그인 실패', '카카오 로그인 처리 중 오류가 발생했습니다.');
    }
  };

  return (
    <View style={styles.container}>
      {/* <Text>Detox Mate</Text>
      <StatusBar style="auto" /> */}

      <Button title="카카오 로그인" onPress={handleLogin} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
