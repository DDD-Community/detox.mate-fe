import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import StorybookUI from './.rnstorybook/index';

SplashScreen.preventAutoHideAsync();

const isStorybookEnabled = process.env.EXPO_PUBLIC_STORYBOOK_ENABLED === 'true';

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

  if (isStorybookEnabled) {
    return <StorybookUI />;
  }

  return (
    <View style={styles.container}>
      <Text>Detox Mate</Text>
      <StatusBar style="auto" />
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
