import * as ImagePicker from 'expo-image-picker';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { Button } from '../../../components/Button';
import { analyzeScreenTimeImage } from '../../../features/screen-time-analyze';
import { primitiveColors } from '../../../lib/token/primitive/colors';
import { typography } from '../../../lib/token/primitive/typography';

const { gray, brown, green } = primitiveColors;

export default function VerifyUploadScreen() {
  const { imageUri: paramImageUri } = useLocalSearchParams<{ imageUri?: string }>();
  const [imageUri, setImageUri] = useState<string | undefined>(paramImageUri);
  const hasImage = Boolean(imageUri);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showErrorAlert, setShowErrorAlert] = useState(false);

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
    const result = await analyzeScreenTimeImage(imageUri);
    setIsAnalyzing(false);
    if (!result.ok) {
      setShowErrorAlert(true);
      return;
    }
    router.replace({
      pathname: '/(group)/verify/done',
      params: { value: result.value },
    });
  };

  const handleRetake = () => {
    setShowErrorAlert(false);
    router.replace('/(group)/verify/method');
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
              <Text style={styles.title}>{'내 스크린 타임을\n인증해주세요'}</Text>
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
      {showErrorAlert && (
        <View style={styles.alertOverlay} pointerEvents="box-none">
          <View style={styles.alert}>
            <View style={styles.alertTextGroup}>
              <Text style={styles.alertTitle}>날짜를 인식할 수 없습니다.</Text>
              <Text style={styles.alertDescription}>날짜가 포함되게 캡쳐해주세요.</Text>
            </View>
            <Pressable style={styles.alertButton} onPress={handleRetake}>
              <Text style={styles.alertButtonLabel}>다시 캡쳐하러 가기</Text>
            </Pressable>
          </View>
        </View>
      )}
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
  alertOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  alert: {
    width: 270,
    borderRadius: 14,
    backgroundColor: 'rgba(242, 242, 242, 0.96)',
    overflow: 'hidden',
  },
  alertTextGroup: {
    paddingTop: 19,
    paddingBottom: 15,
    paddingHorizontal: 16,
    alignItems: 'center',
    gap: 2,
  },
  alertTitle: {
    fontSize: 17,
    lineHeight: 22,
    fontWeight: '600',
    letterSpacing: -0.43,
    color: '#000000',
    textAlign: 'center',
  },
  alertDescription: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '400',
    letterSpacing: -0.08,
    color: '#000000',
    textAlign: 'center',
  },
  alertButton: {
    height: 44,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(128, 128, 128, 0.55)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  alertButtonLabel: {
    fontSize: 17,
    lineHeight: 22,
    fontWeight: '600',
    letterSpacing: -0.43,
    color: green[300],
  },
});
