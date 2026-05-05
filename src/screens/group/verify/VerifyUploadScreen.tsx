import * as ImagePicker from 'expo-image-picker';
import { router, useLocalSearchParams } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import { useState } from 'react';
import { ActivityIndicator, Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { Button } from '../../../components/Button';
import { getActivityRecord } from '../../../api/generated/activity-record/activity-record';
import { ActivityRecordDetailRequestUsageGoalType } from '../../../api/generated/model';
import { analyzeScreenTimeImage } from '../../../features/screen-time-analyze';
import { primitiveColors } from '../../../lib/token/primitive/colors';
import { typography } from '../../../lib/token/primitive/typography';

function parseValueToMinutes(value: string): number {
  const [hStr, mStr] = value.split(':');
  return Number(hStr ?? 0) * 60 + Number(mStr ?? 0);
}

const { gray, brown } = primitiveColors;

export default function VerifyUploadScreen() {
  const {
    imageUri: paramImageUri,
    mode,
    goal,
    groupChallengeParticipantId,
  } = useLocalSearchParams<{
    imageUri?: string;
    mode?: 'initial' | 'verify';
    goal?: string;
    groupChallengeParticipantId?: string;
  }>();
  const [imageUri, setImageUri] = useState<string | undefined>(paramImageUri);
  const forwardParams = {
    ...(mode ? { mode } : {}),
    ...(goal ? { goal } : {}),
    ...(groupChallengeParticipantId ? { groupChallengeParticipantId } : {}),
  };
  const hasImage = Boolean(imageUri);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const handlePickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 1,
    });
    if (result.canceled || !result.assets[0]) return;
    setImageUri(result.assets[0].uri);
  };

  const handleAnalyze = async () => {
    if (!imageUri) return;
    setIsAnalyzing(true);
    try {
      let result = await analyzeScreenTimeImage(imageUri);

      // TODO: 임시 — 분석 결과 무관하게 항상 성공 처리. 실제 OCR 연동 시 이 블록 삭제.
      result = {
        ok: true,
        value: '4:32',
        dateLabel: '어제',
        rawUsageText: '4시간 32분',
        elapsedMs: 0,
      };

      if (!result.ok) {
        router.replace({ pathname: '/(group)/verify/error', params: forwardParams });
        return;
      }

      const userId = await SecureStore.getItemAsync('currentUserId');
      const { allAchieved } = await getActivityRecord().checkAchievement(
        {
          details: [
            {
              usageGoalType: ActivityRecordDetailRequestUsageGoalType.TOTAL_USAGE,
              usedMinutes: parseValueToMinutes(result.value),
            },
          ],
        },
        { currentUser: { id: userId ? Number(userId) : undefined } }
      );

      router.replace({
        pathname: '/(group)/verify/done',
        params: { value: result.value, achieved: String(allAchieved ?? false), ...forwardParams },
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const buttonLabel = isAnalyzing ? '분석중이에요...' : '분석하기';
  const buttonDisabled = !hasImage || isAnalyzing;

  return (
    <Pressable style={styles.overlay} onPress={() => (isAnalyzing ? null : router.back())}>
      <Pressable style={styles.sheet} onPress={() => {}}>
        <View style={styles.grabberWrap}>
          <View style={styles.grabber} />
        </View>

        <View style={styles.content}>
          <View style={styles.section}>
            <View style={styles.textGroup}>
              <Text style={styles.title}>
                {mode === 'verify'
                  ? '어제의 스크린 타임을\n인증해주세요'
                  : '내 스크린 타임을\n인증해주세요'}
              </Text>
              <Text style={styles.description}>
                {'스크린 타임 캡쳐를 업로드해주세요.\n목표 기반 데이터로 이용돼요.'}
              </Text>
            </View>

            {hasImage ? (
              <View style={styles.previewBox}>
                <Image source={{ uri: imageUri }} style={styles.preview} resizeMode="cover" />
              </View>
            ) : (
              <Pressable style={styles.dropzone} onPress={handlePickImage}>
                <View style={styles.iconCircle}>
                  <Image
                    source={require('../../../../assets/icons/regular/icon_rg_UploadSimple.png')}
                    style={styles.uploadIcon}
                    resizeMode="contain"
                  />
                </View>
                <View style={styles.dropzoneText}>
                  <Text style={styles.dropzoneTitle}>캡처 업로드</Text>
                  <Text style={styles.dropzoneCaption}>AI로 사용시간이 자동 분석돼요</Text>
                </View>
              </Pressable>
            )}
          </View>

          <Button
            label={buttonLabel}
            color="assistive"
            onPress={handleAnalyze}
            disabled={buttonDisabled}
            style={styles.button}
            leadingIcon={
              isAnalyzing ? <ActivityIndicator size="small" color="#FFFFFF" /> : undefined
            }
          />
        </View>
      </Pressable>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: brown[50],
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  grabberWrap: {
    paddingTop: 5,
    paddingBottom: 11,
    alignItems: 'center',
  },
  grabber: {
    width: 52,
    height: 5,
    borderRadius: 100,
    backgroundColor: gray[100],
  },
  content: {
    gap: 40,
  },
  section: {
    gap: 40,
  },
  textGroup: {
    gap: 12,
  },
  title: {
    ...typography.accent.h3,
    color: gray[900],
    letterSpacing: -0.52,
  },
  description: {
    ...typography.primary.body2R,
    color: gray[400],
    letterSpacing: -0.28,
  },
  dropzone: {
    height: 180,
    borderRadius: 13,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: gray[100],
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    overflow: 'hidden',
  },
  previewBox: {
    height: 259,
    borderRadius: 13,
    borderWidth: 1,
    borderColor: gray[100],
    backgroundColor: '#FFFFFF',
    overflow: 'hidden',
  },
  iconCircle: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  uploadIcon: {
    width: 23,
    height: 23,
  },
  dropzoneText: {
    alignItems: 'center',
    gap: 4,
  },
  dropzoneTitle: {
    ...typography.accent.body1,
    color: '#4A5565',
    letterSpacing: -0.36,
  },
  dropzoneCaption: {
    ...typography.primary.caption,
    color: '#6A7282',
    letterSpacing: -0.22,
  },
  preview: {
    flex: 1,
    width: '100%',
  },
  button: {
    alignSelf: 'stretch',
  },
});
