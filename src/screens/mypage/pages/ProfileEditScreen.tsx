import { QueryErrorResetBoundary } from '@tanstack/react-query';
import { Suspense, useRef } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ErrorBoundary } from '@/components/AppErrorBoundary/AppErrorBoundary';
import { Icon, LoggingButton, LoggingPage } from '@/components';
import { goBackOrReplace } from '@/lib/navigation';
import { primitiveColors, spacing, typography } from '@/lib/token';
import { ProfileAvatar } from '../components/ProfileAvatar';
import { ProfilePhotoDialog } from '../components/ProfilePhotoDialog';
import { useMyProfile } from '../hooks/useMyProfilePageData';
import { useProfileEditor } from '../hooks/useProfileEditor';
import { PROFILE_NAME_MAX_LENGTH } from '../utils/profileRules';

const { gray, green } = primitiveColors;
const AVATAR_SIZE = 128;
const CAMERA_BADGE_SIZE = 28;

export default function ProfileEditScreen() {
  return (
    <LoggingPage eventName="My Profile Edit Viewed" properties={{ pageName: 'MyProfileEdit' }}>
      <SafeAreaView style={styles.root} edges={['top']}>
        <QueryErrorResetBoundary>
          {({ reset }) => (
            <ErrorBoundary onReset={reset}>
              <Suspense
                fallback={
                  <ActivityIndicator
                    color={green[300]}
                    style={styles.loading}
                    accessibilityLabel="프로필 불러오는 중"
                  />
                }
              >
                <ProfileEditContent />
              </Suspense>
            </ErrorBoundary>
          )}
        </QueryErrorResetBoundary>
      </SafeAreaView>
    </LoggingPage>
  );
}

function ProfileEditContent() {
  const { displayName, profileImageUrl, userCode } = useMyProfile();
  const editor = useProfileEditor({ displayName, profileImageUrl });
  const nameInputRef = useRef<TextInput>(null);

  return (
    <View style={styles.flex}>
      <View style={styles.header}>
        <Pressable
          onPress={() => goBackOrReplace('/(group)/mypage')}
          hitSlop={8}
          style={styles.back}
          accessibilityRole="button"
          accessibilityLabel="뒤로가기"
        >
          <Icon name="caretLeft" size={24} color={gray[800]} />
          <Text style={styles.headerTitle}>프로필 편집</Text>
        </Pressable>
        <Pressable
          onPress={editor.save}
          disabled={editor.saving}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel="저장"
        >
          {editor.saving ? (
            <ActivityIndicator size="small" color={green[300]} />
          ) : (
            <Text style={styles.save}>저장</Text>
          )}
        </Pressable>
      </View>

      <View style={styles.avatarArea}>
        <View>
          <ProfileAvatar uri={editor.previewImageUri} size={AVATAR_SIZE} />
          <LoggingButton
            eventName="My Profile Photo Edit Clicked"
            properties={{ pageName: 'MyProfileEdit', buttonName: '카메라 아이콘' }}
          >
            <Pressable
              onPress={editor.openPhotoDialog}
              style={styles.cameraBadge}
              accessibilityRole="button"
              accessibilityLabel="프로필 사진 변경"
            >
              <Icon name="camera" size={24} color={gray[800]} />
            </Pressable>
          </LoggingButton>
        </View>
      </View>

      <View style={styles.fields}>
        <Pressable style={styles.row} onPress={() => nameInputRef.current?.focus()}>
          <Text style={styles.label}>이름</Text>
          <TextInput
            ref={nameInputRef}
            value={editor.name}
            onChangeText={editor.changeName}
            maxLength={PROFILE_NAME_MAX_LENGTH * 2}
            style={styles.nameInput}
            textAlign="right"
            autoCorrect={false}
            returnKeyType="done"
            accessibilityLabel="이름"
          />
        </Pressable>
        <View style={styles.divider} />
        <View style={styles.row}>
          <Text style={styles.label}>초대코드</Text>
          <Text style={styles.inviteCode}>{userCode}</Text>
        </View>
      </View>
      <Text style={styles.hint}>사진 및 이름은 디톡스메이트 검색 결과에서 볼 수 있습니다.</Text>

      <ProfilePhotoDialog
        visible={editor.photoDialogVisible}
        onClose={editor.closePhotoDialog}
        onSelectGallery={editor.selectGalleryPhoto}
        onSelectDefault={editor.selectDefaultPhoto}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#FFFFFF' },
  flex: { flex: 1 },
  loading: { padding: spacing[24] },
  header: {
    height: 54,
    paddingHorizontal: spacing[16],
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  back: { flexDirection: 'row', alignItems: 'center', gap: spacing[16] },
  headerTitle: { ...typography.primary.title1M, color: gray[800] },
  save: { ...typography.primary.body1M, color: green[300] },
  avatarArea: { alignItems: 'center', paddingTop: spacing[32], paddingBottom: spacing[32] },
  cameraBadge: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    width: CAMERA_BADGE_SIZE,
    height: CAMERA_BADGE_SIZE,
    borderRadius: CAMERA_BADGE_SIZE / 2,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  fields: {
    marginHorizontal: spacing[16],
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: gray[100],
  },
  divider: { height: 1, backgroundColor: gray[100] },
  row: {
    height: spacing[60],
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  label: { ...typography.primary.body1R, color: gray[900] },
  nameInput: {
    ...typography.primary.body1M,
    flex: 1,
    color: gray[900],
    paddingVertical: 0,
  },
  inviteCode: { ...typography.primary.body1R, color: gray[300] },
  hint: {
    ...typography.primary.body3R,
    marginTop: spacing[16],
    marginHorizontal: spacing[16],
    color: gray[300],
  },
});
