import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    NanumSquareRoundL: require('../assets/fonts/nanum-square-round/NanumSquareRoundL.ttf'),
    NanumSquareRoundR: require('../assets/fonts/nanum-square-round/NanumSquareRoundR.ttf'),
    NanumSquareRoundB: require('../assets/fonts/nanum-square-round/NanumSquareRoundB.ttf'),
    NanumSquareRoundEB: require('../assets/fonts/nanum-square-round/NanumSquareRoundEB.ttf'),
  });

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) return null;

  return <Stack screenOptions={{ headerShown: false }} />;
}
