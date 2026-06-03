import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { getScreenTimeOcrErrorReport } from '@/api/generated/screen-time-ocr-error-report/screen-time-ocr-error-report';
import { PresignedUrlRequestUploadPurpose } from '@/api/generated/model';
import { parseHHMMToMinutes } from '@/lib/formatDuration';
import { primitiveColors, typography } from '@/lib/token';
import { uploadImage } from '@/lib/uploadImage';
import { buildVerifyValueParams, getVerifyPath, type VerifyRoot } from './verifyFlowParams';

const { brown, green } = primitiveColors;

export default function VerifyWrongTimeScreen() {
  const {
    achieved,
    value,
    groupChallengeParticipantId,
    verifyRoot,
    ocrImageUri,
    ocrImageObjectKey,
    ocrRecordDate,
  } = useLocalSearchParams<{
    achieved?: string;
    value?: string;
    groupChallengeParticipantId?: string;
    verifyRoot?: VerifyRoot;
    ocrImageUri?: string;
    ocrImageObjectKey?: string;
    ocrRecordDate?: string;
  }>();
  const goalAchieved = achieved !== '0';
  const [isSubmittingReport, setIsSubmittingReport] = useState(false);
  const didSubmitReportRef = useRef(false);

  useEffect(() => {
    if (didSubmitReportRef.current) return;

    const participantId = groupChallengeParticipantId ? Number(groupChallengeParticipantId) : NaN;
    const usedMinutes = parseHHMMToMinutes(value);

    if (!Number.isFinite(participantId) || !ocrRecordDate || usedMinutes == null) {
      return;
    }

    didSubmitReportRef.current = true;
    setIsSubmittingReport(true);

    const submitReport = async () => {
      const imageObjectKey =
        ocrImageObjectKey ??
        (ocrImageUri
          ? await uploadImage(ocrImageUri, {
              uploadPurpose: PresignedUrlRequestUploadPurpose.SCREEN_TIME_OCR_REPORT_IMAGE,
            })
          : undefined);

      if (!imageObjectKey) return;

      await getScreenTimeOcrErrorReport().create({
        groupChallengeParticipantId: participantId,
        recordDate: ocrRecordDate,
        imageObjectKey,
        ocrTotalUsedMinutes: usedMinutes,
      });
    };

    submitReport()
      .catch(() => {
        didSubmitReportRef.current = false;
      })
      .finally(() => {
        setIsSubmittingReport(false);
      });
  }, [groupChallengeParticipantId, ocrImageObjectKey, ocrImageUri, ocrRecordDate, value]);

  const handleClose = () => {
    router.back();
  };

  const handleConfirm = () => {
    if (goalAchieved) {
      router.replace('/(group)/post');
    } else {
      router.replace({
        pathname: getVerifyPath('retro', verifyRoot),
        params: buildVerifyValueParams({ value, groupChallengeParticipantId, verifyRoot }),
      });
    }
  };

  return (
    <View style={styles.overlay}>
      <View style={styles.alert}>
        <Text style={styles.title}>접수 되었습니다</Text>
        <Text style={styles.body}>{'사진을 검토한 뒤\n수일 내로 반영해 드릴게요'}</Text>
        <View style={styles.actions}>
          <Pressable style={styles.closeButton} onPress={handleClose} disabled={isSubmittingReport}>
            <Text style={styles.closeLabel}>닫기</Text>
          </Pressable>
          <Pressable
            style={styles.confirmButton}
            onPress={handleConfirm}
            disabled={isSubmittingReport}
          >
            <Text style={styles.confirmLabel}>확인</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  alert: {
    width: '100%',
    maxWidth: 326,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingHorizontal: 24,
    paddingVertical: 24,
    gap: 20,
  },
  title: {
    ...typography.primary.title1B,
    color: '#0A0A0A',
    textAlign: 'center',
    letterSpacing: -0.4,
  },
  body: {
    ...typography.primary.body2R,
    color: '#4A5565',
    textAlign: 'center',
    letterSpacing: -0.28,
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
  },
  closeButton: {
    height: 50,
    width: 108,
    paddingHorizontal: 16,
    borderRadius: 18,
    backgroundColor: brown[900],
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeLabel: {
    ...typography.primary.body1B,
    color: '#FFFFFF',
    textAlign: 'center',
    letterSpacing: -0.32,
  },
  confirmButton: {
    height: 50,
    minWidth: 88,
    paddingHorizontal: 16,
    borderRadius: 18,
    backgroundColor: green[300],
    alignItems: 'center',
    justifyContent: 'center',
    flexBasis: 0,
    flexGrow: 1,
  },
  confirmLabel: {
    ...typography.primary.body1B,
    color: '#FFFFFF',
    textAlign: 'center',
    letterSpacing: -0.32,
  },
});
