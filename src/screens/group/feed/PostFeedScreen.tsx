import * as ImagePicker from 'expo-image-picker';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { HeaderAction, Icon, LoggingButton, LoggingPage } from '../../../components';
import { submitTotalUsageActivityRecord } from '../../../features/activity-record/submitTotalUsageActivityRecord';
import { uploadImage } from '../../../lib/uploadImage';
import { goBackOrReplace } from '../../../lib/navigation';
import { primitiveColors } from '../../../lib/token/primitive/colors';
import { typography } from '../../../lib/token/primitive/typography';

const { gray, brown, green } = primitiveColors;

export default function PostFeedScreen() {
  const { value, groupChallengeParticipantId } = useLocalSearchParams<{
    value?: string;
    groupChallengeParticipantId?: string;
  }>();

  const [imageAsset, setImageAsset] = useState<ImagePicker.ImagePickerAsset | undefined>();
  const [text, setText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const participantId = groupChallengeParticipantId
    ? Number(groupChallengeParticipantId)
    : undefined;
  const hasValidParticipantId = participantId != null && !Number.isNaN(participantId);

  const handlePickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 1,
    });
    if (result.canceled || !result.assets[0]) return;
    setImageAsset(result.assets[0]);
  };

  const handleSkip = async () => {
    await submitTotalUsageActivityRecord({
      value,
      groupChallengeParticipantId,
      goalAchieved: true,
    });
    router.replace('/(group)/verify/complete');
  };

  const canPost =
    hasValidParticipantId && !submitting && (imageAsset != null || text.trim().length > 0);

  const handlePost = async () => {
    if (!canPost) return;
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
        goalAchieved: true,
      });
      router.replace('/(group)/verify/complete');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <LoggingPage eventName="Post Feed Viewed" properties={{ pageName: 'PostFeed' }}>
      <SafeAreaView style={styles.root}>
        <View style={styles.header}>
          <LoggingButton
            eventName="Post Feed Back Clicked"
            properties={{ pageName: 'PostFeed', buttonName: '뒤로가기' }}
          >
            <HeaderAction
              label="게시물 올리기"
              onPress={() => goBackOrReplace('/(group)/home')}
              iconColor={gray[900]}
              style={styles.headerBack}
              textStyle={styles.headerTitle}
              accessibilityLabel="뒤로가기"
            />
          </LoggingButton>
          <LoggingButton
            eventName="Post Feed Skip Clicked"
            properties={{ pageName: 'PostFeed', buttonName: '건너뛰기' }}
          >
            <Pressable style={styles.headerSkip} onPress={handleSkip}>
              <Text style={styles.headerSkipLabel}>건너뛰기</Text>
            </Pressable>
          </LoggingButton>
        </View>

        <KeyboardAvoidingView
          style={styles.body}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <LoggingButton
            eventName="Post Feed Photo Upload Select Clicked"
            properties={{ pageName: 'PostFeed', buttonName: '사진 업로드' }}
          >
            <Pressable style={styles.dropzone} onPress={handlePickImage}>
              {imageAsset ? (
                <Image source={{ uri: imageAsset.uri }} style={styles.preview} resizeMode="cover" />
              ) : (
                <>
                  <View style={styles.iconCircle}>
                    <Icon name="uploadSimple" size={23} color="#2B2F38" />
                  </View>
                  <View style={styles.dropzoneText}>
                    <Text style={styles.dropzoneTitle}>사진 업로드 (선택)</Text>
                    <Text style={styles.dropzoneCaption}>디톡스 시간에 무얼 했나요?</Text>
                  </View>
                </>
              )}
            </Pressable>
          </LoggingButton>

          <View style={styles.textareaSection}>
            <Text style={styles.textareaLabel}>직접 입력 (선택)</Text>
            <View style={styles.textareaBox}>
              <TextInput
                style={styles.textarea}
                placeholder="오늘 대신 뭐 했는지 자유롭게 남겨보세요 🌿"
                placeholderTextColor={gray[300]}
                multiline
                value={text}
                onChangeText={setText}
              />
            </View>
          </View>

          <View style={styles.cta}>
            <LoggingButton
              eventName="Post Feed Post Submit Clicked"
              properties={{ pageName: 'PostFeed', buttonName: '게시하기' }}
            >
              <Pressable
                style={[styles.postButton, !canPost && styles.postButtonDisabled]}
                onPress={handlePost}
                disabled={!canPost}
              >
                {submitting ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.postButtonLabel}>게시하기</Text>
                )}
              </Pressable>
            </LoggingButton>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </LoggingPage>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: brown[50],
  },
  header: {
    height: 54,
    paddingLeft: 16,
    paddingRight: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: brown[50],
  },
  headerBack: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  headerTitle: {
    ...typography.accent.title2,
    color: gray[800],
    letterSpacing: -0.4,
  },
  headerSkip: {
    height: 44,
    minWidth: 80,
    paddingHorizontal: 12,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerSkipLabel: {
    ...typography.primary.body2B,
    color: green[300],
    letterSpacing: -0.28,
  },
  body: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  dropzone: {
    height: 181,
    borderRadius: 13,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: gray[100],
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
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
    width: '100%',
    height: '100%',
  },
  textareaSection: {
    marginTop: 24,
    gap: 8,
  },
  textareaLabel: {
    ...typography.primary.body1B,
    color: gray[900],
    letterSpacing: -0.32,
  },
  textareaBox: {
    height: 96,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  textarea: {
    flex: 1,
    fontFamily: typography.primary.body1R.fontFamily,
    fontSize: typography.primary.body1R.fontSize,
    fontWeight: typography.primary.body1R.fontWeight,
    color: gray[900],
    letterSpacing: -0.32,
    textAlignVertical: 'top',
  },
  cta: {
    marginTop: 'auto',
    paddingTop: 16,
    paddingBottom: 20,
  },
  postButton: {
    height: 50,
    borderRadius: 18,
    backgroundColor: green[300],
    alignItems: 'center',
    justifyContent: 'center',
  },
  postButtonDisabled: {
    backgroundColor: gray[200],
  },
  postButtonLabel: {
    ...typography.primary.body1B,
    color: '#FFFFFF',
    letterSpacing: -0.32,
  },
});
