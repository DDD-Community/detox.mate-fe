import * as Clipboard from 'expo-clipboard';
import * as Linking from 'expo-linking';
import { router } from 'expo-router';
import { useRef } from 'react';
import { Alert, AppState } from 'react-native';

import { pickImageFromLibrary } from './useImageLibraryPicker';
import { buildVerifyFlowParams, getVerifyPath, type VerifyFlowParams } from './verifyFlowParams';

const SETTINGS_ROOT_URLS = ['prefs:', 'App-Prefs:'];

async function openSettings() {
  for (const url of SETTINGS_ROOT_URLS) {
    try {
      await Linking.openURL(url);
      return;
    } catch {
      // try next
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

    await openSettings();
  };

  const handleClipboard = async () => {
    const result = await Clipboard.getImageAsync({ format: 'png' });
    if (!result) {
      Alert.alert('클립보드에 이미지가 없어요', '스크린 타임 캡쳐를 먼저 복사해 주세요.');
      return;
    }

    router.replace({
      pathname: getVerifyPath('upload', params.verifyRoot),
      params: { imageUri: result.data, ...forwardParams },
    });
  };

  return {
    handleGallery,
    handleSettings,
    handleClipboard,
  };
}
