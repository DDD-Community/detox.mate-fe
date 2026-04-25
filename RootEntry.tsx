import { useEffect, useState } from 'react';
import type { ComponentType } from 'react';
import { Linking } from 'react-native';

import App from './App';
import { ScreenTimeAnalyzeTestScreen } from './src/features/screen-time-analyze/ScreenTimeAnalyzeTestScreen';
import {
  ROOT_ROUTE_CONFIG,
  type RootTarget,
  resolveRootTarget,
} from './src/root-entry/resolveRootTarget';

const ROOT_SCREENS: Record<RootTarget, ComponentType> = {
  app: App,
  'screen-time-analyze-test': ScreenTimeAnalyzeTestScreen,
};

export default function RootEntry() {
  const [currentTarget, setCurrentTarget] = useState<RootTarget | null>(null);

  useEffect(() => {
    let isMounted = true;

    void Linking.getInitialURL().then((url) => {
      if (!isMounted) {
        return;
      }

      setCurrentTarget(resolveRootTarget(url));
    });

    const subscription = Linking.addEventListener('url', ({ url }) => {
      if (!isMounted) {
        return;
      }

      setCurrentTarget(resolveRootTarget(url));
    });

    return () => {
      isMounted = false;
      subscription.remove();
    };
  }, []);

  if (currentTarget === null) {
    return null;
  }

  const ActiveScreen = ROOT_SCREENS[currentTarget] ?? ROOT_SCREENS[ROOT_ROUTE_CONFIG.defaultTarget];

  return <ActiveScreen />;
}
