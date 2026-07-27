import type * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import { useState } from 'react';
import { Alert } from 'react-native';

import { getUserErrorMessage, logError, normalizeError } from '@/api/errors';
import { submitTotalUsageActivityRecord } from '@/features/activity-record/submitTotalUsageActivityRecord';
import { uploadImage } from '@/lib/uploadImage';
import { pickImageFromLibrary } from './useImageLibraryPicker';
import {
  buildVerifyFlowParams,
  getVerifyPath,
  parseParticipantId,
  type VerifyRoot,
} from './verifyFlowParams';

interface UseRetroFormOptions {
  value?: string;
  groupChallengeParticipantId?: string;
  verifyRoot?: VerifyRoot;
}

export function useRetroForm({
  value,
  groupChallengeParticipantId,
  verifyRoot,
}: UseRetroFormOptions) {
  const [imageAsset, setImageAsset] = useState<ImagePicker.ImagePickerAsset | undefined>();
  const [text, setText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const participantId = parseParticipantId(groupChallengeParticipantId);
  const canSubmit = text.trim().length > 0 && participantId != null && !submitting;

  const handlePickImage = async () => {
    const asset = await pickImageFromLibrary();
    if (!asset) return;

    setImageAsset(asset);
  };

  const handleSubmit = async () => {
    if (!canSubmit) return;

    setSubmitting(true);
    try {
      const objectKey = imageAsset
        ? await uploadImage(imageAsset.uri, {
            fileName: imageAsset.fileName,
            mimeType: imageAsset.mimeType,
            fileSize: imageAsset.fileSize,
          })
        : undefined;

      await submitTotalUsageActivityRecord({
        value,
        groupChallengeParticipantId: participantId,
        reflectionText: text,
        activityImageObjectKey: objectKey,
        goalAchieved: false,
      });
      router.replace({
        pathname: getVerifyPath('complete', verifyRoot),
        params: buildVerifyFlowParams({ verifyRoot }),
      });
    } catch (error) {
      const appError = normalizeError(error);
      logError(appError, { scope: 'verify.retro', operation: 'submitActivityRecord' });
      const message = getUserErrorMessage(appError, {
        presentation: 'dialog',
        userMessage:
          appError.type === 'upload'
            ? '이미지 업로드에 실패했어요. 다시 시도해 주세요.'
            : '게시에 실패했어요. 다시 시도해 주세요.',
      });
      Alert.alert('게시 실패', message);
    } finally {
      setSubmitting(false);
    }
  };

  return {
    canSubmit,
    handlePickImage,
    handleSubmit,
    imageAsset,
    setText,
    submitting,
    text,
  };
}
