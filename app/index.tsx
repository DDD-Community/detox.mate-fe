import { Redirect, type Href } from 'expo-router';
import * as ExpoSplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import SplashScreen from '../src/screens/SplashScreen';

export default function Index() {
  const devEntry = __DEV__ ? process.env.EXPO_PUBLIC_DEV_ENTRY : undefined;
  useEffect(() => {
    if (devEntry) void ExpoSplashScreen.hideAsync();
  }, [devEntry]);
  if (devEntry) return <Redirect href={devEntry as Href} />;
  return <SplashScreen />;
}
