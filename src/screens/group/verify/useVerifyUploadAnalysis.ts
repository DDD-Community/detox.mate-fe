import { router } from 'expo-router';
import { useState } from 'react';

import { ActivityRecordDetailRequestUsageGoalType, getActivityRecord } from '@/api';
import { analyzeScreenTimeImage } from '@/features/screen-time-analyze';
import { pickImageFromLibrary } from './useImageLibraryPicker';
import { buildVerifyFlowParams, type VerifyFlowParams, type VerifyMode } from './verifyFlowParams';
import { parseHHMMToMinutes } from './verifyTime';

interface UseVerifyUploadAnalysisOptions extends VerifyFlowParams {
  imageUri?: string;
  mode?: VerifyMode;
}

export function useVerifyUploadAnalysis({
  imageUri: initialImageUri,
  mode,
  goal,
  groupChallengeParticipantId,
}: UseVerifyUploadAnalysisOptions) {
  const [imageUri, setImageUri] = useState<string | undefined>(initialImageUri);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const forwardParams = buildVerifyFlowParams({ mode, goal, groupChallengeParticipantId });
  const hasImage = Boolean(imageUri);

  const handlePickImage = async () => {
    const asset = await pickImageFromLibrary();
    if (!asset) return;

    setImageUri(asset.uri);
  };

  const handleAnalyze = async () => {
    if (!imageUri) return;

    setIsAnalyzing(true);
    try {
      const result = await analyzeScreenTimeImage(imageUri);

      if (!result.ok) {
        router.replace({ pathname: '/(group)/verify/error', params: forwardParams });
        return;
      }

      if (mode !== 'verify') {
        router.replace({
          pathname: '/(group)/verify/done',
          params: { value: result.value, ...forwardParams },
        });
        return;
      }

      const { allAchieved } = await getActivityRecord().checkAchievement({
        details: [
          {
            usageGoalType: ActivityRecordDetailRequestUsageGoalType.TOTAL_USAGE,
            usedMinutes: parseHHMMToMinutes(result.value) ?? 0,
          },
        ],
      });

      router.replace({
        pathname: '/(group)/verify/done',
        params: { value: result.value, achieved: String(allAchieved ?? false), ...forwardParams },
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  return {
    buttonDisabled: !hasImage || isAnalyzing,
    buttonLabel: isAnalyzing ? '분석중이에요...' : '분석하기',
    handleAnalyze,
    handlePickImage,
    hasImage,
    imageUri,
    isAnalyzing,
  };
}
