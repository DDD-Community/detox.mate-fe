import * as Linking from 'expo-linking';
import { router } from 'expo-router';
import { useRef } from 'react';
import { AppState } from 'react-native';

import { pickImageFromLibrary } from './useImageLibraryPicker';
import { buildVerifyFlowParams, getVerifyPath, type VerifyFlowParams } from './verifyFlowParams';

const SCREEN_TIME_SETTINGS_URLS = [
  'prefs:root=SCREEN_TIME',
  'App-Prefs:root=SCREEN_TIME',
  'App-Prefs:SCREEN_TIME',
  'prefs:root=ScreenTime',
];

const SETTINGS_ROOT_URLS = ['prefs:', 'App-Prefs:'];

async function tryOpen(url: string): Promise<boolean> {
  try {
    await Linking.openURL(url);
    return true;
  } catch {
    return false;
  }
}

async function openScreenTimeSettings() {
  for (const url of SCREEN_TIME_SETTINGS_URLS) {
    if (await tryOpen(url)) return;
  }

  for (const url of SETTINGS_ROOT_URLS) {
    if (await tryOpen(url)) return;
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
