import { router } from 'expo-router';
import { ScrollView, StyleSheet, View } from 'react-native';

import { primitiveColors, spacing } from '@/lib/token';
import { MyPageBody } from './mypage/MyPageBody';
import { MyPageProfileHeader } from './mypage/MyPageProfileHeader';
import { ProfileImageBottomSheet } from './mypage/ProfileImageBottomSheet';
import { buildMyPageViewModel } from './mypage/myPageViewModel';
import { useFriendPoke } from './mypage/useFriendPoke';
import { useMyPageData } from './mypage/useMyPageData';
import {
  DEFAULT_PROFILE_IMAGE_OBJECT_KEY,
  useProfileImageUpdater,
} from './mypage/useProfileImageUpdater';
import { useMyPageParams } from './mypage/useMyPageParams';

const { brown } = primitiveColors;

export default function MyPageScreen() {
  const myPageParams = useMyPageParams();
  const isFriend = myPageParams.mode === 'friend';
  const friendName = isFriend ? myPageParams.friendName : undefined;
  const friendUserId = isFriend ? myPageParams.friendUserId : undefined;
  const challengeRecordId = isFriend ? myPageParams.challengeRecordId : undefined;
  const groupChallengeId = isFriend ? myPageParams.groupChallengeId : undefined;
  const initialIsPoked = isFriend ? myPageParams.isPoked === '1' : false;
  const { isPoking, isPoked, poke } = useFriendPoke({
    challengeRecordId,
    groupChallengeId,
    friendUserId,
    initialIsPoked,
  });

  const {
    isImageSheetOpen,
    profileImageUri,
    isUpdatingProfileImage,
    setProfileImageUri,
    openImageSheet,
    closeImageSheet,
    selectDefaultImage,
    selectGalleryImage,
  } = useProfileImageUpdater();

  const { profile, hasGoalSet, groups, memberProfile, friendProfile, isLoading } = useMyPageData({
    params: myPageParams,
    onProfileImageUriChange: setProfileImageUri,
  });

  const handleBack = () => {
    router.back();
  };

  const handleSettings = () => {
    router.push('/(group)/settings');
  };

  const handleEditName = () => {
    router.push('/(group)/nickname-edit');
  };

  const handleEditProfileImage = () => {
    openImageSheet();
  };

  const handleSetGoal = () => {
    router.push('/(group)/verify');
  };

  const handleCreateGroup = () => {
    router.push('/(group)/create');
  };

  const handleEnterInviteCode = () => {
    router.push('/(group)/join');
  };

  const handleGroupPress = (groupId?: number) => {
    router.push({
      pathname: '/(group)/group-info',
      params: groupId != null ? { groupId: String(groupId) } : undefined,
    });
  };

  const handleChangeGoal = () => {
    router.push('/(group)/goal-time-edit');
  };

  const {
    displayName,
    dayCount,
    achievementRate,
    hasJoinedGroup,
    isFriendGoalSet,
    weeklyStatus,
    joinedGroups,
    daysUntilGoalChange,
    displayProfileImageUri,
    hasProfileBackground,
  } = buildMyPageViewModel({
    isFriend,
    friendName,
    profile,
    memberProfile,
    friendProfile,
    groups,
    profileImageUri,
    defaultProfileImageObjectKey: DEFAULT_PROFILE_IMAGE_OBJECT_KEY,
  });
  const {
    avgScreenTime,
    goalScreenTime,
    diffMinutes,
    certifiedDays,
    totalVerifyDays,
    achievedDays,
  } = weeklyStatus;

  return (
    <View style={styles.root}>
      <ScrollView
        style={styles.screenScroll}
        contentContainerStyle={styles.screenContent}
        showsVerticalScrollIndicator={false}
      >
        <MyPageProfileHeader
          isFriend={isFriend}
          displayName={displayName}
          dayCount={dayCount}
          achievementRate={achievementRate}
          displayProfileImageUri={displayProfileImageUri}
          hasProfileBackground={hasProfileBackground}
          isUpdatingProfileImage={isUpdatingProfileImage}
          onBack={handleBack}
          onSettings={handleSettings}
          onEditName={handleEditName}
          onEditProfileImage={handleEditProfileImage}
        />

        <MyPageBody
          isFriend={isFriend}
          isLoading={isLoading}
          isFriendGoalSet={isFriendGoalSet}
          isPoking={isPoking}
          isPoked={isPoked}
          hasGoalSet={hasGoalSet}
          hasJoinedGroup={hasJoinedGroup}
          diffMinutes={diffMinutes}
          avgScreenTime={avgScreenTime}
          goalScreenTime={goalScreenTime}
          certifiedDays={certifiedDays}
          totalVerifyDays={totalVerifyDays}
          achievedDays={achievedDays}
          joinedGroups={joinedGroups}
          daysUntilGoalChange={daysUntilGoalChange}
          onPoke={poke}
          onSetGoal={handleSetGoal}
          onCreateGroup={handleCreateGroup}
          onEnterInviteCode={handleEnterInviteCode}
          onGroupPress={handleGroupPress}
          onChangeGoal={handleChangeGoal}
        />
      </ScrollView>

      <ProfileImageBottomSheet
        visible={isImageSheetOpen}
        onClose={closeImageSheet}
        onSelectDefault={selectDefaultImage}
        onSelectGallery={selectGalleryImage}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: brown[50],
  },
  screenScroll: {
    flex: 1,
  },
  screenContent: {
    flexGrow: 1,
    paddingBottom: spacing[24],
  },
});
