import { router, useLocalSearchParams } from 'expo-router';
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

import { Icon } from '@/components';
import { primitiveColors, typography } from '@/lib/token';
import { useRetroForm } from './useRetroForm';

const { gray, brown, green, system } = primitiveColors;

export default function RetroScreen() {
  const { value, groupChallengeParticipantId } = useLocalSearchParams<{
    value?: string;
    groupChallengeParticipantId?: string;
  }>();
  const { canSubmit, handlePickImage, handleSubmit, imageAsset, setText, submitting, text } =
    useRetroForm({
      value,
      groupChallengeParticipantId,
    });

  return (
    <SafeAreaView style={styles.root}>
      <View style={styles.header}>
        <Pressable style={styles.headerBack} onPress={() => router.back()}>
          <Icon name="caretLeft" size={24} color={gray[900]} />
          <Text style={styles.headerTitle}>오늘의 회고</Text>
        </Pressable>
      </View>

      <KeyboardAvoidingView
        style={styles.body}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.content}>
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

          <View style={styles.textareaSection}>
            <Text style={styles.textareaLabel}>
              직접 입력<Text style={styles.requiredMark}>*</Text>
            </Text>
            <View style={styles.textareaBox}>
              <TextInput
                style={styles.textarea}
                placeholder="오늘 하루를 짧게 되돌아보세요"
                placeholderTextColor={gray[300]}
                multiline
                value={text}
                onChangeText={setText}
              />
            </View>
          </View>
        </View>

        <View style={styles.cta}>
          <Pressable
            style={[styles.postButton, !canSubmit && styles.postButtonDisabled]}
            onPress={handleSubmit}
            disabled={!canSubmit}
          >
            {submitting ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.postButtonLabel}>게시하기</Text>
            )}
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
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
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
  body: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  content: {
    gap: 40,
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
    gap: 12,
  },
  textareaLabel: {
    ...typography.primary.body1B,
    color: gray[900],
    letterSpacing: -0.32,
  },
  requiredMark: {
    color: system.red.opacity100,
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
