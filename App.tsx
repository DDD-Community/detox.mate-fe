import { Button, StyleSheet, View } from 'react-native';
import { loginWithKakao, logout, refreshAccessToken } from './auth/kakaoLogin';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';

SplashScreen.preventAutoHideAsync();

export default function App() {
  const [fontsLoaded, fontError] = useFonts({
    NanumSquareRoundL: require('./assets/fonts/nanum-square-round/NanumSquareRoundL.ttf'),
    NanumSquareRoundR: require('./assets/fonts/nanum-square-round/NanumSquareRoundR.ttf'),
    NanumSquareRoundB: require('./assets/fonts/nanum-square-round/NanumSquareRoundB.ttf'),
    NanumSquareRoundEB: require('./assets/fonts/nanum-square-round/NanumSquareRoundEB.ttf'),
  });

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) return null;

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
