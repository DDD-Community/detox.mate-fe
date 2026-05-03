import * as ImagePicker from 'expo-image-picker';
import { router, useLocalSearchParams } from 'expo-router';
import { useRef, useState } from 'react';
import { Animated, ActivityIndicator, Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { Button } from '../../../components/Button';
import { analyzeScreenTimeImage } from '../../../features/screen-time-analyze';
import { primitiveColors } from '../../../lib/token/primitive/colors';
import { typography } from '../../../lib/token/primitive/typography';

const { gray, brown } = primitiveColors;

export default function VerifyUploadScreen() {
  const { imageUri: paramImageUri } = useLocalSearchParams<{ imageUri?: string }>();
  const [imageUri, setImageUri] = useState<string | undefined>(paramImageUri);
  const hasImage = Boolean(imageUri);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const toastOpacity = useRef(new Animated.Value(0)).current;

  const handlePickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 1,
    });
    if (result.canceled || !result.assets[0]) return;
    setImageUri(result.assets[0].uri);
  };

  const showToast = () => {
    Animated.sequence([
      Animated.timing(toastOpacity, { toValue: 1, duration: 200, useNativeDriver: true }),
      Animated.delay(2500),
      Animated.timing(toastOpacity, { toValue: 0, duration: 300, useNativeDriver: true }),
    ]).start(() => setImageUri(undefined));
  };

  const handleAnalyze = async () => {
    if (!imageUri) return;
    router.replace({
      pathname: '/(group)/verify/done',
      params: { value: '4:32' },
    });
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
      <Animated.View style={[styles.toast, { opacity: toastOpacity }]} pointerEvents="none">
        <Text style={styles.toastText}>{'스크린타임 분석에 실패했어요\n이미지를 재업로드해주세요.'}</Text>
      </Animated.View>
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
  toast: {
    position: 'absolute',
    bottom: 60,
    alignSelf: 'center',
    zIndex: 10,
    backgroundColor: 'rgba(10, 10, 10, 0.85)',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 20,
  },
  toastText: {
    ...typography.primary.body2R,
    color: '#FFFFFF',
    textAlign: 'center',
    letterSpacing: -0.28,
  },
});
