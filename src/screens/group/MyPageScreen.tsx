import { router } from 'expo-router';
import { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { getReaction } from '@/api/generated/reaction/reaction';
import { primitiveColors, spacing } from '@/lib/token';
import ReactionPicker, { isSameReaction, type ReactionCode } from '@/screens/feed/ReactionPicker';
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
  const insets = useSafeAreaInsets();
  const myPageParams = useMyPageParams();
  const isFriend = myPageParams.mode === 'friend';
  const friendName = isFriend ? myPageParams.friendName : undefined;
  const friendUserId = isFriend ? myPageParams.friendUserId : undefined;
  const challengeRecordId = isFriend ? myPageParams.challengeRecordId : undefined;
  const { isPoking, poke } = useFriendPoke({ challengeRecordId, friendUserId });
  const [isReactionPickerOpen, setIsReactionPickerOpen] = useState(false);
  const [isReacting, setIsReacting] = useState(false);
  const [selectedReactions, setSelectedReactions] = useState<string[]>([]);
  const [reactionIds, setReactionIds] = useState<Record<string, number>>({});

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

  const handleToggleReactionPicker = () => {
    setIsReactionPickerOpen((prev) => !prev);
  };

  const handleSelectReaction = async (reactionCode: ReactionCode) => {
    if (isReacting || !challengeRecordId) return;

    const challengeRecordIdNumber = Number(challengeRecordId);
    if (Number.isNaN(challengeRecordIdNumber)) return;

    const existingReactionId = reactionIds[reactionCode];
    setIsReactionPickerOpen(false);
    setIsReacting(true);

    if (existingReactionId != null) {
      setSelectedReactions((prev) =>
        prev.filter((reaction) => !isSameReaction(reaction, reactionCode))
      );
      try {
        await getReaction().deleteReaction(challengeRecordIdNumber, existingReactionId);
        setReactionIds((prev) => {
          const next = { ...prev };
          delete next[reactionCode];
          return next;
        });
      } catch {
        setSelectedReactions((prev) =>
          prev.some((reaction) => isSameReaction(reaction, reactionCode))
            ? prev
            : [...prev, reactionCode]
        );
      } finally {
        setIsReacting(false);
      }
      return;
    }

    setSelectedReactions((prev) =>
      prev.some((reaction) => isSameReaction(reaction, reactionCode))
        ? prev
        : [...prev, reactionCode]
    );
    try {
      const response = await getReaction().createReaction(challengeRecordIdNumber, {
        reactionCode,
      });
      const reactionId = response.reactionId;
      if (reactionId != null) {
        setReactionIds((prev) => ({ ...prev, [reactionCode]: reactionId }));
      }
    } catch {
      setSelectedReactions((prev) =>
        prev.filter((reaction) => !isSameReaction(reaction, reactionCode))
      );
    } finally {
      setIsReacting(false);
    }
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
          isReacting={isReacting}
          onPoke={poke}
          onToggleReactionPicker={handleToggleReactionPicker}
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

      {isFriend && isReactionPickerOpen ? (
        <View
          pointerEvents="box-none"
          style={[styles.reactionPickerAnchor, { bottom: Math.max(insets.bottom + 12, 20) }]}
        >
          <ReactionPicker
            selectedReactions={selectedReactions}
            style={styles.reactionPicker}
            onSelect={handleSelectReaction}
          />
        </View>
      ) : null}
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
  reactionPickerAnchor: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  reactionPicker: {
    width: 311,
  },
});
