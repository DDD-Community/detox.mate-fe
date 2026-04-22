import { Button, StyleSheet, View } from 'react-native';
import { loginWithKakao, logout, refreshAccessToken } from './auth/kakaoLogin';

export default function App() {
  return (
    <View style={styles.container}>
      <Button title="카카오 로그인" onPress={loginWithKakao} />
      <Button title="토큰 리프레시!" onPress={refreshAccessToken} />
      <Button title="로그아웃!!" onPress={logout} />
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
