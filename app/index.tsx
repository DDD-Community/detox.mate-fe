import { Redirect } from 'expo-router';
import SplashScreen from '../src/screens/SplashScreen';

export default function Index() {
  // if (__DEV__ && process.env.EXPO_PUBLIC_DEV_ENTRY) {
  //   return <Redirect href={process.env.EXPO_PUBLIC_DEV_ENTRY as never} />;
  // }
  return <SplashScreen />;
}
