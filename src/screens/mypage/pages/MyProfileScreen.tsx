import { QueryErrorResetBoundary } from '@tanstack/react-query';
import { router } from 'expo-router';
import { Suspense } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ErrorBoundary } from '@/components/AppErrorBoundary/AppErrorBoundary';
import { Icon, LoggingButton, LoggingPage } from '@/components';
import { DetoxmateWordmark } from '@/components/DetoxmateWordmark/DetoxmateWordmark';
import { primitiveColors, radius, spacing, typography } from '@/lib/token';
import { FriendsPreview } from '../components/FriendsPreview';
import { ProfileAvatar } from '../components/ProfileAvatar';
import { ShareProfileChip } from '../components/ShareProfileChip';
import { useMyProfilePageData } from '../hooks/useMyProfilePageData';
import { useShareFriendInvite } from '@/screens/friends/hooks/useShareFriendInvite';

const { gray, green } = primitiveColors;
const PROFILE_AVATAR_SIZE = 128;

export default function MyProfileScreen() {
  return (
    <LoggingPage eventName="My Profile Viewed" properties={{ pageName: 'MyProfile' }}>
      <SafeAreaView style={styles.root} edges={['top']}>
        <View style={styles.header}>
          <DetoxmateWordmark />
          <LoggingButton
            eventName="My Profile Settings Clicked"
            properties={{ pageName: 'MyProfile', buttonName: '설정 아이콘' }}
          >
            <Pressable
              onPress={() => router.push('/(group)/settings')}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel="설정"
            >
              <Icon name="gearSix" size={24} color={gray[900]} />
            </Pressable>
          </LoggingButton>
        </View>
        <QueryErrorResetBoundary>
          {({ reset }) => (
            <ErrorBoundary onReset={reset}>
              <Suspense
                fallback={
                  <ActivityIndicator
                    color={green[300]}
                    style={styles.loading}
                    accessibilityLabel="마이페이지 불러오는 중"
                  />
                }
              >
                <MyProfileContent />
              </Suspense>
            </ErrorBoundary>
          )}
        </QueryErrorResetBoundary>
      </SafeAreaView>
    </LoggingPage>
  );
}

function MyProfileContent() {
  const { displayName, profileImageUrl, userCode, recentFriends } = useMyProfilePageData();
  const { share, sharing } = useShareFriendInvite();
  const hasFriends = recentFriends.length > 0;

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <View style={styles.profile}>
        <ProfileAvatar uri={profileImageUrl} size={PROFILE_AVATAR_SIZE} />
        <View style={styles.identity}>
          <Text style={styles.name}>{displayName}</Text>
          {userCode ? <Text style={styles.userCode}>{userCode}</Text> : null}
        </View>
        <LoggingButton
          eventName="My Profile Edit Clicked"
          properties={{ pageName: 'MyProfile', buttonName: '편집' }}
        >
          <Pressable
            onPress={() => router.push('/(group)/mypage-edit')}
            style={styles.editChip}
            accessibilityRole="button"
          >
            <Text style={styles.editChipLabel}>편집</Text>
          </Pressable>
        </LoggingButton>
      </View>

      <View style={styles.friends}>
        <LoggingButton
          eventName="My Profile Friends List Clicked"
          properties={{ pageName: 'MyProfile', buttonName: '친구 목록' }}
        >
          <Pressable
            onPress={() => router.push('/(group)/friends')}
            style={styles.friendsTitle}
            accessibilityRole="button"
          >
            <Text style={styles.friendsTitleText}>친구 목록</Text>
            <Icon name="caretRight" size={22} color={gray[900]} />
          </Pressable>
        </LoggingButton>
        {hasFriends ? <FriendsPreview friends={recentFriends} /> : null}
      </View>

      <View style={styles.share}>
        <Text style={styles.shareMessage}>
          {hasFriends
            ? '프로필을 공유해서 더 많은 친구를\n초대해보세요.'
            : '프로필을 공유해\n친구를 초대해보세요!'}
        </Text>
        <ShareProfileChip onPress={share} pending={sharing} />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#FFFFFF' },
  header: {
    height: 54,
    paddingHorizontal: spacing[16],
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  loading: { padding: spacing[24] },
  content: { paddingBottom: spacing[40] },
  profile: { alignItems: 'center', paddingTop: spacing[16], gap: spacing[12] },
  identity: { alignItems: 'center', gap: spacing[4] },
  name: { ...typography.primary.h2, lineHeight: 38, color: gray[900] },
  userCode: { ...typography.primary.body2R, fontSize: 15, lineHeight: 22, color: gray[300] },
  editChip: {
    height: spacing[36],
    paddingHorizontal: spacing[12],
    justifyContent: 'center',
    borderRadius: radius.full,
    backgroundColor: green[300],
  },
  editChipLabel: { ...typography.primary.body2M, color: '#FFFFFF' },
  friends: { marginTop: spacing[24], gap: spacing[12] },
  friendsTitle: {
    alignSelf: 'flex-start',
    marginHorizontal: spacing[16],
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[4],
  },
  friendsTitleText: { ...typography.primary.title1B, color: gray[900] },
  share: { marginTop: spacing[40], alignItems: 'center', gap: spacing[12] },
  shareMessage: { ...typography.primary.body2R, textAlign: 'center', color: gray[300] },
});
