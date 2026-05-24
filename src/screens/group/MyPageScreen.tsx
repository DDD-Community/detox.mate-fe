import { router } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { getPoke } from '../../api/generated/poke/poke';
import { Button } from '../../components/Button';
import { primitiveColors, radius, spacing, typography } from '../../lib/token';
import { JoinedGroupBody } from './mypage/JoinedGroupBody';
import { MyPageProfileHeader } from './mypage/MyPageProfileHeader';
import { ProfileImageBottomSheet } from './mypage/ProfileImageBottomSheet';
import { WeeklyStatusCard } from './mypage/WeeklyStatusCard';
import { buildMyPageViewModel } from './mypage/myPageViewModel';
import { useMyPageData } from './mypage/useMyPageData';
import {
  DEFAULT_PROFILE_IMAGE_OBJECT_KEY,
  useProfileImageUpdater,
} from './mypage/useProfileImageUpdater';
import { useMyPageParams } from './mypage/useMyPageParams';

import CALENDAR_IMG from '../../../assets/mypage-calender.png';
import GROUP_INVITE_IMG from '../../../assets/onboarding-group-invite.png';
import GROUP_PLUS_IMG from '../../../assets/onboarding-group-plus.png';

const { brown, gray } = primitiveColors;

interface GroupActionCardProps {
  image: number;
  imageWidth: number;
  imageHeight: number;
  label: string;
  onPress?: () => void;
}

function GroupActionCard({ image, imageWidth, imageHeight, label, onPress }: GroupActionCardProps) {
  return (
    <Pressable onPress={onPress} style={styles.actionCard}>
      <Image
        source={image}
        style={{ width: imageWidth, height: imageHeight }}
        resizeMode="contain"
      />
      <Text style={styles.actionCardLabel}>{label}</Text>
    </Pressable>
  );
}

export default function MyPageScreen() {
  const myPageParams = useMyPageParams();
  const isFriend = myPageParams.mode === 'friend';
  const friendName = isFriend ? myPageParams.friendName : undefined;
  const friendUserId = isFriend ? myPageParams.friendUserId : undefined;
  const challengeRecordId = isFriend ? myPageParams.challengeRecordId : undefined;

  const [isPoking, setIsPoking] = useState(false);

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

  const handlePoke = async () => {
    if (isPoking) return;
    if (!challengeRecordId || !friendUserId) {
      // 콕 찌르기에 필요한 정보가 없으면 무시 (라우팅하는 쪽에서 채워주어야 함)
      return;
    }
    setIsPoking(true);
    try {
      await getPoke().pokeUser(Number(challengeRecordId), Number(friendUserId));
    } finally {
      setIsPoking(false);
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

        {isFriend && isLoading ? (
          <View style={styles.loadingWrap}>
            <ActivityIndicator color={gray[400]} />
          </View>
        ) : isFriend && !isFriendGoalSet ? (
          <>
            <View style={styles.friendEmptyState}>
              <Image source={CALENDAR_IMG} style={styles.calendar} resizeMode="contain" />
              <Text style={styles.friendEmptyText}>
                아직 목표를 설정하지 않았어요.{'\n'}목표 설정 알림을 보내주세요!
              </Text>
            </View>
            <SafeAreaView edges={['bottom']} style={styles.pokeCtaWrap}>
              <Button
                label="콕 찌르기"
                color="primary"
                disabled={isPoking}
                onPress={handlePoke}
                style={styles.pokeCta}
              />
            </SafeAreaView>
          </>
        ) : isFriend ? (
          <View style={styles.friendBody}>
            <WeeklyStatusCard
              weekLabel="최근 7일"
              diffMinutes={diffMinutes}
              avgScreenTime={avgScreenTime}
              goalScreenTime={goalScreenTime}
              verifiedDays={certifiedDays}
              totalVerifyDays={totalVerifyDays}
              achievedDays={achievedDays}
              achievableDays={certifiedDays}
            />
          </View>
        ) : isLoading ? (
          <View style={styles.loadingWrap}>
            <ActivityIndicator color={gray[400]} />
          </View>
        ) : hasGoalSet && hasJoinedGroup ? (
          <JoinedGroupBody
            weekLabel="최근 7일"
            diffMinutes={diffMinutes}
            avgScreenTime={avgScreenTime}
            goalScreenTime={goalScreenTime}
            verifiedDays={certifiedDays}
            totalVerifyDays={totalVerifyDays}
            achievedDays={achievedDays}
            achievableDays={certifiedDays}
            groups={joinedGroups}
            daysUntilGoalChange={daysUntilGoalChange}
            onGroupPress={handleGroupPress}
            onGoalChangePress={handleChangeGoal}
          />
        ) : hasGoalSet ? (
          <View style={styles.goalSetBody}>
            <View style={styles.actionCardRow}>
              <GroupActionCard
                image={GROUP_PLUS_IMG}
                imageWidth={30}
                imageHeight={29}
                label="새 그룹 만들기"
                onPress={handleCreateGroup}
              />
              <GroupActionCard
                image={GROUP_INVITE_IMG}
                imageWidth={42}
                imageHeight={29}
                label="초대 코드 입력"
                onPress={handleEnterInviteCode}
              />
            </View>
            <Text style={styles.actionHelperText}>
              새 그룹을 만들거나 친구가 만든 그룹에 입장해요
            </Text>
          </View>
        ) : (
          <>
            <View style={styles.emptyState}>
              <Image source={CALENDAR_IMG} style={styles.calendar} resizeMode="contain" />
              <Text style={styles.emptyText}>목표 설정을 해야 참여할 수 있어요.</Text>
            </View>

            <SafeAreaView edges={['bottom']} style={styles.ctaWrap}>
              <Button
                label="목표 스크린 타임 설정"
                color="assistive"
                onPress={handleSetGoal}
                style={styles.cta}
              />
            </SafeAreaView>
          </>
        )}
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
  loadingWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing[16],
    paddingHorizontal: spacing[24],
  },
  calendar: {
    width: 62,
    height: 62,
  },
  emptyText: {
    ...typography.primary.body2R,
    color: gray[400],
    textAlign: 'center',
  },
  ctaWrap: {
    paddingHorizontal: spacing[16],
    paddingBottom: spacing[8],
  },
  cta: {
    alignSelf: 'stretch',
  },
  goalSetBody: {
    paddingHorizontal: spacing[16],
    paddingTop: spacing[16],
    gap: spacing[16],
    alignItems: 'center',
  },
  actionCardRow: {
    flexDirection: 'row',
    gap: spacing[8],
    alignSelf: 'stretch',
  },
  actionCard: {
    flex: 1,
    height: 164,
    borderRadius: radius[12],
    borderWidth: 1,
    borderColor: gray[100],
    backgroundColor: brown[50],
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing[16],
    paddingHorizontal: spacing[20],
  },
  actionCardLabel: {
    ...typography.accent.body1,
    color: gray[500],
    textAlign: 'center',
  },
  actionHelperText: {
    ...typography.primary.body2R,
    color: gray[400],
    textAlign: 'center',
  },
  friendBody: {
    paddingHorizontal: spacing[16],
    paddingTop: spacing[16],
  },
  friendEmptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing[16],
    paddingHorizontal: spacing[24],
  },
  friendEmptyText: {
    ...typography.primary.body3R,
    fontSize: 14,
    lineHeight: 21,
    color: gray[400],
    textAlign: 'center',
  },
  pokeCtaWrap: {
    paddingHorizontal: spacing[16],
    paddingBottom: spacing[16],
    alignItems: 'center',
  },
  pokeCta: {
    width: 311,
    alignSelf: 'center',
  },
});
