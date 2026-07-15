import { useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
  type ImageLoadEvent,
  type ImageStyle,
  type LayoutChangeEvent,
} from 'react-native';

import { Button, Icon, LoggingButton, LoggingPage } from '@/components';
import { getVerifyExitRoute, goBackOrReplace } from '@/lib/navigation';
import { primitiveColors, typography } from '@/lib/token';
import { useVerifyUploadAnalysis } from './useVerifyUploadAnalysis';
import { VerifyBottomSheet } from './VerifyBottomSheet';
import type { VerifyMode, VerifyRoot } from './verifyFlowParams';

const { gray } = primitiveColors;
const PREVIEW_HEIGHT = 259;

type Size = {
  width: number;
  height: number;
};

function getCenteredCoverStyle(
  containerSize: Size,
  imageSize: Size | null
): ImageStyle | undefined {
  if (!imageSize || containerSize.width <= 0 || containerSize.height <= 0) {
    return undefined;
  }

  const imageAspectRatio = imageSize.width / imageSize.height;
  const containerAspectRatio = containerSize.width / containerSize.height;

  if (imageAspectRatio > containerAspectRatio) {
    const width = containerSize.height * imageAspectRatio;

    return {
      width,
      height: containerSize.height,
      left: (containerSize.width - width) / 2,
    };
  }

  return {
    width: containerSize.width,
    height: containerSize.width / imageAspectRatio,
    left: 0,
    top: (containerSize.height - containerSize.width / imageAspectRatio) / 2,
  };
}

export default function VerifyUploadScreen() {
  const [previewWidth, setPreviewWidth] = useState(0);
  const [imageSize, setImageSize] = useState<Size | null>(null);
  const {
    imageUri: paramImageUri,
    mode,
    goal,
    groupChallengeParticipantId,
    verifyRoot,
  } = useLocalSearchParams<{
    imageUri?: string;
    mode?: VerifyMode;
    goal?: string;
    groupChallengeParticipantId?: string;
    verifyRoot?: VerifyRoot;
  }>();
  const {
    buttonDisabled,
    buttonLabel,
    handleAnalyze,
    handlePickImage,
    hasImage,
    imageUri,
    isAnalyzing,
  } = useVerifyUploadAnalysis({
    imageUri: paramImageUri,
    mode,
    goal,
    groupChallengeParticipantId,
    verifyRoot,
  });
  const previewImageStyle = getCenteredCoverStyle(
    { width: previewWidth, height: PREVIEW_HEIGHT },
    imageSize
  );

  const handlePreviewLayout = (event: LayoutChangeEvent) => {
    setPreviewWidth(event.nativeEvent.layout.width);
  };

  const handlePreviewLoad = (event: ImageLoadEvent) => {
    const { width, height } = event.nativeEvent.source;

    setImageSize({ width, height });
  };

  return (
    <LoggingPage
      eventName="Verify Upload Viewed"
      properties={{ pageName: 'VerifyUpload', verify_mode: mode ?? 'initial' }}
    >
      <VerifyBottomSheet
        onDismiss={() => goBackOrReplace(getVerifyExitRoute(verifyRoot))}
        dismissDisabled={isAnalyzing}
      >
        <View style={styles.content}>
          <View style={styles.section}>
            <View style={styles.textGroup}>
              <Text style={styles.title}>
                {mode === 'verify'
                  ? '어제의 스크린 타임을\n인증해 주세요'
                  : '내 스크린 타임을\n인증해 주세요'}
              </Text>
              <Text style={styles.description}>
                {'스크린 타임 캡쳐를 업로드해 주세요.\n목표 기반 데이터로 이용돼요.'}
              </Text>
            </View>

            {hasImage ? (
              <View style={styles.previewBox} onLayout={handlePreviewLayout}>
                <Image
                  source={{ uri: imageUri }}
                  style={[styles.preview, previewImageStyle ?? styles.previewFallback]}
                  resizeMode="cover"
                  onLoad={handlePreviewLoad}
                />
              </View>
            ) : (
              <LoggingButton
                eventName="Verify Upload Screenshot Upload Select Clicked"
                properties={{
                  pageName: 'VerifyUpload',
                  buttonName: '캡처 업로드',
                  verify_mode: mode ?? 'initial',
                }}
              >
                <Pressable style={styles.dropzone} onPress={handlePickImage}>
                  <View style={styles.iconCircle}>
                    <Icon name="uploadSimple" size={23} color="#2B2F38" />
                  </View>
                  <View style={styles.dropzoneText}>
                    <Text style={styles.dropzoneTitle}>캡처 업로드</Text>
                    <Text style={styles.dropzoneCaption}>AI로 사용시간이 자동 스캔돼요</Text>
                  </View>
                </Pressable>
              </LoggingButton>
            )}
          </View>

          <LoggingButton
            eventName="Verify Upload Screenshot Scan Start Clicked"
            properties={{
              pageName: 'VerifyUpload',
              buttonName: '스캔하기',
              verify_mode: mode ?? 'initial',
            }}
          >
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
          </LoggingButton>
        </View>
      </VerifyBottomSheet>
    </LoggingPage>
  );
}

const styles = StyleSheet.create({
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
    height: PREVIEW_HEIGHT,
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
    position: 'absolute',
    top: 0,
  },
  previewFallback: {
    width: '100%',
    height: '100%',
  },
  button: {
    alignSelf: 'stretch',
  },
});
