import { router } from 'expo-router';
import { useState } from 'react';

import { ActivityRecordDetailRequestUsageGoalType, getActivityRecord } from '@/api';
import { logError, normalizeError } from '@/api/errors';
import { analyzeScreenTimeImage } from '@/features/screen-time-analyze';
import { parseHHMMToMinutes } from '@/lib/formatDuration';
import { pickImageFromLibrary } from './useImageLibraryPicker';
import {
  buildVerifyFlowParams,
  getVerifyPath,
  type VerifyFlowParams,
  type VerifyMode,
} from './verifyFlowParams';

const formatDateParam = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const getOcrRecordDate = () => {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  date.setDate(date.getDate() - 1);
  return formatDateParam(date);
};

interface UseVerifyUploadAnalysisOptions extends VerifyFlowParams {
  imageUri?: string;
  mode?: VerifyMode;
}

export function useVerifyUploadAnalysis({
  imageUri: initialImageUri,
  mode,
  goal,
  groupChallengeParticipantId,
  verifyRoot,
}: UseVerifyUploadAnalysisOptions) {
  const [imageUri, setImageUri] = useState<string | undefined>(initialImageUri);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const forwardParams = buildVerifyFlowParams({
    mode,
    goal,
    groupChallengeParticipantId,
    verifyRoot,
  });
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
        router.replace({
          pathname: getVerifyPath('error', verifyRoot),
          params: {
            ...forwardParams,
            reason: result.reason,
            ...(result.dateLabel ? { dateLabel: result.dateLabel } : {}),
          },
        });
        return;
      }

      const reportParams = {
        ocrImageUri: imageUri,
        ocrRecordDate: getOcrRecordDate(),
      };

      if (mode === 'verify') {
        const { allAchieved } = await getActivityRecord().checkAchievement({
          details: [
            {
              usageGoalType: ActivityRecordDetailRequestUsageGoalType.TOTAL_USAGE,
              usedMinutes: parseHHMMToMinutes(result.value) ?? 0,
            },
          ],
        });

        router.replace({
          pathname: getVerifyPath('done', verifyRoot),
          params: {
            value: result.value,
            achieved: String(allAchieved ?? false),
            ...forwardParams,
            ...reportParams,
          },
        });
        return;
      }

      router.replace({
        pathname: getVerifyPath('done', verifyRoot),
        params: { value: result.value, ...forwardParams, ...reportParams },
      });
    } catch (error) {
      logError(normalizeError(error), {
        scope: 'verify.upload',
        operation: 'analyzeAndCheckAchievement',
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  return {
    buttonDisabled: !hasImage || isAnalyzing,
    buttonLabel: isAnalyzing ? '스캔중이에요...' : '스캔하기',
    handleAnalyze,
    handlePickImage,
    hasImage,
    imageUri,
    isAnalyzing,
  };
}
