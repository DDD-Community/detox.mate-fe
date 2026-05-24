import type * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import { useState } from 'react';

import { submitTotalUsageActivityRecord } from '@/features/activity-record/submitTotalUsageActivityRecord';
import { uploadImage } from '@/lib/uploadImage';
import { pickImageFromLibrary } from './useImageLibraryPicker';
import { parseParticipantId } from './verifyFlowParams';

interface UseRetroFormOptions {
  value?: string;
  groupChallengeParticipantId?: string;
}

export function useRetroForm({ value, groupChallengeParticipantId }: UseRetroFormOptions) {
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
      });
      router.replace('/(group)/verify/complete');
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
