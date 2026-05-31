import * as Linking from 'expo-linking';
import { router } from 'expo-router';
import { useRef } from 'react';
import { AppState } from 'react-native';

import { pickImageFromLibrary } from './useImageLibraryPicker';
import { buildVerifyFlowParams, getVerifyPath, type VerifyFlowParams } from './verifyFlowParams';

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

    await Linking.openURL('App-Prefs:');
  };

  return {
    handleGallery,
    handleSettings,
  };
}
