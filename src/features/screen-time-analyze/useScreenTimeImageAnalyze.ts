import * as ImagePicker from 'expo-image-picker';
import { useState } from 'react';

import { analyzeScreenTimeImage } from './analyzeScreenTimeImage';
import type { ScreenTimeImageAnalysisResult } from './types';

export function useScreenTimeImageAnalyze() {
  const [selectedImageUri, setSelectedImageUri] = useState<string | null>(null);
  const [analysisResult, setAnalysisResult] = useState<ScreenTimeImageAnalysisResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function pickImage() {
    setErrorMessage(null);

    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      setErrorMessage('사진 보관함 접근 권한이 필요합니다.');
      return false;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: false,
      quality: 1,
    });

    if (result.canceled || !result.assets[0]?.uri) {
      return false;
    }

    setSelectedImageUri(result.assets[0].uri);
    setAnalysisResult(null);
    return true;
  }

  async function analyzeImage() {
    if (!selectedImageUri) {
      setErrorMessage('먼저 이미지를 선택해 주세요.');
      return null;
    }

    setIsAnalyzing(true);
    setErrorMessage(null);
    setAnalysisResult(null);

    try {
      const result = await analyzeScreenTimeImage(selectedImageUri);

      if (!result.ok && result.reason === 'analysis_failed') {
        setErrorMessage(result.message ?? '이미지 분석에 실패했습니다.');
        return null;
      }

      setAnalysisResult(result);
      return result;
    } catch (error) {
      const message = error instanceof Error ? error.message : '이미지 분석에 실패했습니다.';
      setAnalysisResult(null);
      setErrorMessage(message);
      return null;
    } finally {
      setIsAnalyzing(false);
    }
  }

  return {
    selectedImageUri,
    analysisResult,
    isAnalyzing,
    errorMessage,
    pickImage,
    analyzeImage,
  };
}
