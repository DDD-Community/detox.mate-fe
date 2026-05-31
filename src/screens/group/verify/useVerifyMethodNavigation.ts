import * as Linking from 'expo-linking';
import { router } from 'expo-router';
import { useRef } from 'react';
import { AppState } from 'react-native';

import { pickImageFromLibrary } from './useImageLibraryPicker';
import { buildVerifyFlowParams, getVerifyPath, type VerifyFlowParams } from './verifyFlowParams';

const SCREEN_TIME_SETTINGS_URLS = [
  'App-Prefs:root=SCREEN_TIME',
  'App-Prefs:SCREEN_TIME',
  'App-Prefs:',
];

async function openScreenTimeSettings() {
  for (const url of SCREEN_TIME_SETTINGS_URLS) {
    try {
      await Linking.openURL(url);
      return;
    } catch {
      // Try the next known Settings URL. iOS Settings deep links vary by OS version.
    }
  }
}

export function useVerifyMethodNavigation(params: VerifyFlowParams) {
  const awaitingReturnRef = useRef(false);
  const forwardParams = buildVerifyFlowParams(params);

  const handleGallery = async () => {
    const asset = await pickImageFromLibrary();
    if (!asset) return;

    router.replace({
      pathname: getVerifyPath('upload', params.verifyRoot),
      params: { imageUri: asset.uri, ...forwardParams },
    });
  };

  const handleSettings = async () => {
    awaitingReturnRef.current = true;
    const subscription = AppState.addEventListener('change', (state) => {
      if (state !== 'active' || !awaitingReturnRef.current) return;

      awaitingReturnRef.current = false;
      subscription.remove();
      router.replace({
        pathname: getVerifyPath('upload', params.verifyRoot),
        params: forwardParams,
      });
    });

    await openScreenTimeSettings();
  };

  return {
    handleGallery,
    handleSettings,
  };
}
