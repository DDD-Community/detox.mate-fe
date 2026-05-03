import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import { useState } from 'react';
import {
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
import { primitiveColors } from '../../../lib/token/primitive/colors';
import { typography } from '../../../lib/token/primitive/typography';

const { gray, brown, green } = primitiveColors;

export default function PostFeedScreen() {
  const [imageUri, setImageUri] = useState<string | undefined>();
  const [text, setText] = useState('');

  const handlePickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 1,
    });
    if (result.canceled || !result.assets[0]) return;
    setImageUri(result.assets[0].uri);
  };

  const handleSkip = () => {
    router.replace('/(group)/verify/complete');
  };

  const canPost = text.trim().length > 0;

  const handlePost = () => {
    if (!canPost) return;
    router.replace('/(group)/verify/complete');
  };

  return (
    <SafeAreaView style={styles.root}>
      <View style={styles.header}>
        <Pressable style={styles.headerBack} onPress={() => router.back()}>
          <Image
            source={require('../../../../assets/icons/regular/icon_rg_CaretLeft.png')}
            style={styles.headerBackIcon}
            resizeMode="contain"
          />
          <Text style={styles.headerTitle}>게시물 올리기</Text>
        </Pressable>
        <Pressable style={styles.headerSkip} onPress={handleSkip}>
          <Text style={styles.headerSkipLabel}>건너뛰기</Text>
        </Pressable>
      </View>

      <KeyboardAvoidingView
        style={styles.body}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <Pressable style={styles.dropzone} onPress={handlePickImage}>
          {imageUri ? (
            <Image source={{ uri: imageUri }} style={styles.preview} resizeMode="cover" />
          ) : (
            <>
              <View style={styles.iconCircle}>
                <Image
                  source={require('../../../../assets/icons/regular/icon_rg_UploadSimple.png')}
                  style={styles.uploadIcon}
                  resizeMode="contain"
                />
              </View>
              <View style={styles.dropzoneText}>
                <Text style={styles.dropzoneTitle}>사진 업로드 (선택)</Text>
                <Text style={styles.dropzoneCaption}>디톡스 시간에 무얼 했나요?</Text>
              </View>
            </>
          )}
        </Pressable>

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
          <Pressable
            style={[styles.postButton, !canPost && styles.postButtonDisabled]}
            onPress={handlePost}
            disabled={!canPost}
          >
            <Text style={styles.postButtonLabel}>게시하기</Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
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
  headerBackIcon: {
    width: 24,
    height: 24,
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
    ...typography.primary.body1R,
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
