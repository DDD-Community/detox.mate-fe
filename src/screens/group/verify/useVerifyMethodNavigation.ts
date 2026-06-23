import * as Linking from 'expo-linking';
import { router } from 'expo-router';
import { useRef } from 'react';
import { AppState } from 'react-native';

import { pickImageFromLibrary } from './useImageLibraryPicker';
import { buildVerifyFlowParams, getVerifyPath, type VerifyFlowParams } from './verifyFlowParams';

// Ordered most-specific → least-specific. iOS recognizes different Settings
// deep-link schemes depending on the OS version, so we try several variants.
// The `prefs:` prefix works on a wider range of recent iOS versions than
// `App-Prefs:`, so it is tried first.
const SCREEN_TIME_SETTINGS_URLS = [
  'prefs:root=SCREEN_TIME',
  'App-Prefs:root=SCREEN_TIME',
  'App-Prefs:SCREEN_TIME',
  'prefs:root=ScreenTime',
];

// Last-resort fallbacks that only open Settings to its previous (possibly
// nested) state — used when no Screen Time deep link is accepted.
const SETTINGS_ROOT_FALLBACK_URLS = ['prefs:', 'App-Prefs:'];

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

  // Could not deep-link into Screen Time on this iOS version.
  for (const url of SETTINGS_ROOT_FALLBACK_URLS) {
    if (await tryOpen(url)) return;
  }

  // Officially documented API. Opens this app's own settings page; guaranteed
  // not to be rejected by App Review.
  try {
    await Linking.openSettings();
  } catch {
    // Nothing more we can do.
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
