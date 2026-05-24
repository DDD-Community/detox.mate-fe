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
import { Icon } from '../../components/Icon';
import { formatMinutesAsHourMinute } from '../../lib/formatDuration';
import { primitiveColors, radius, spacing, typography } from '../../lib/token';
import { JoinedGroupBody } from './mypage/JoinedGroupBody';
import { ProfileImageBottomSheet } from './mypage/ProfileImageBottomSheet';
import { WeeklyStatusCard } from './mypage/WeeklyStatusCard';
import { useMyPageData } from './mypage/useMyPageData';
import {
  DEFAULT_PROFILE_IMAGE_OBJECT_KEY,
  useProfileImageUpdater,
} from './mypage/useProfileImageUpdater';
import { useMyPageParams } from './mypage/useMyPageParams';

import CALENDAR_IMG from '../../../assets/mypage-calender.png';
import GROUP_INVITE_IMG from '../../../assets/onboarding-group-invite.png';
import GROUP_PLUS_IMG from '../../../assets/onboarding-group-plus.png';
import TURTLE_IMG from '../../../assets/turtle-hi.png';

const { brown, gray, green } = primitiveColors;

interface ProfileChipProps {
  label: string;
}

function ProfileChip({ label }: ProfileChipProps) {
  return (
    <View style={styles.chip}>
      <Text style={styles.chipText} numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
}

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

  // 현재 모드에 따른 데이터 소스
  const activeProfile = isFriend ? friendProfile : memberProfile;
  const isFriendGoalSet = (friendProfile?.currentGoals?.length ?? 0) > 0;

  const displayName = isFriend
    ? (friendProfile?.displayName ?? friendName ?? '친구')
    : (profile?.displayName ?? '');
  const dayCount = activeProfile?.activitySummary?.dayCount ?? 0;
  const achievementRate = activeProfile?.activitySummary?.achievementRate ?? 0;
  const hasJoinedGroup = groups.length > 0;

  const weekly = activeProfile?.weeklySummary;
  const avgScreenTime = formatMinutesAsHourMinute(weekly?.averageUsedMinutes);
  const goalScreenTime = formatMinutesAsHourMinute(weekly?.goalMinutes);
  const diffMinutes = weekly?.differenceMinutes ?? 0;
  const certifiedDays = weekly?.certifiedDays ?? 0;
  const totalVerifyDays = weekly?.totalDays ?? 7;
  const achievedDays = weekly?.achievedDays ?? 0;
  const joinedGroups = groups.map((item) => ({
    id: item.id,
    name: item.name ?? '',
    members: (item.members ?? []).map((m) => ({
      name: m.displayName ?? '',
      profileImageUrl: m.profileImageUrl ?? null,
    })),
  }));
  const daysUntilGoalChange = memberProfile?.goalChangeAvailability?.remainingDays ?? 0;

  // 표시할 프로필 이미지: 친구 모드면 친구 응답, 본인 모드면 로컬 state(낙관적 업데이트 + 서버 응답)
  const displayProfileImageUri = isFriend
    ? (friendProfile?.profileImageUrl ?? null)
    : profileImageUri;
  const isDefaultProfileImage =
    displayProfileImageUri?.includes(DEFAULT_PROFILE_IMAGE_OBJECT_KEY) ?? false;
  const hasProfileBackground = Boolean(displayProfileImageUri && !isDefaultProfileImage);

  return (
    <View style={styles.root}>
      <ScrollView
        style={styles.screenScroll}
        contentContainerStyle={styles.screenContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.profileCard}>
          {hasProfileBackground && displayProfileImageUri ? (
            <>
              <Image
                source={{ uri: displayProfileImageUri }}
                style={styles.profileBackgroundImage}
                resizeMode="cover"
              />
              <View style={styles.profileBackgroundDim} />
            </>
          ) : null}
          <SafeAreaView edges={['top']}>
            <View style={styles.header}>
              <Pressable onPress={handleBack} hitSlop={8} style={styles.headerLeft}>
                <Icon
                  name="caretLeft"
                  size={24}
                  color={hasProfileBackground ? '#FFFFFF' : gray[800]}
                />
                <Text style={[styles.headerTitle, hasProfileBackground && styles.photoHeaderText]}>
                  {isFriend ? displayName : '마이페이지'}
                </Text>
              </Pressable>
              {!isFriend && (
                <Pressable onPress={handleSettings} hitSlop={8}>
                  <Icon
                    name="gearSix"
                    size={24}
                    color={hasProfileBackground ? '#FFFFFF' : gray[800]}
                  />
                </Pressable>
              )}
            </View>
          </SafeAreaView>

          <View style={styles.turtleWrap}>
            {!hasProfileBackground && (
              <Image source={TURTLE_IMG} style={styles.turtle} resizeMode="contain" />
            )}
          </View>

          <View style={styles.profileMeta}>
            {isFriend ? (
              <View style={styles.nameRow}>
                <Text style={[styles.nameText, hasProfileBackground && styles.photoNameText]}>
                  {displayName}
                </Text>
              </View>
            ) : (
              <Pressable onPress={handleEditName} style={styles.nameRow} hitSlop={8}>
                <Text style={[styles.nameText, hasProfileBackground && styles.photoNameText]}>
                  {displayName}
                </Text>
                <Icon
                  name="pencilSimple"
                  size={16}
                  color={hasProfileBackground ? '#FFFFFF' : gray[800]}
                />
              </Pressable>
            )}

            <View style={styles.chipRow}>
              <View style={styles.chipGroup}>
                <ProfileChip label={`D+${dayCount}`} />
                <ProfileChip label={`달성률 ${String(achievementRate).padStart(2, '0')}%`} />
              </View>
              {!isFriend && (
                <Pressable
                  onPress={handleEditProfileImage}
                  disabled={isUpdatingProfileImage}
                  style={[
                    styles.cameraButton,
                    isUpdatingProfileImage && styles.cameraButtonDisabled,
                  ]}
                  hitSlop={8}
                >
                  <Icon name="camera" size={20} color={gray[900]} />
                </Pressable>
              )}
            </View>
          </View>
        </View>

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
  profileCard: {
    backgroundColor: brown[100],
    borderBottomLeftRadius: spacing[20],
    borderBottomRightRadius: spacing[20],
    paddingBottom: spacing[16],
    overflow: 'hidden',
  },
  profileBackgroundImage: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
  },
  profileBackgroundDim: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.32)',
  },
  header: {
    height: 54,
    paddingHorizontal: spacing[16],
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[16],
  },
  headerTitle: {
    ...typography.accent.title2,
    color: gray[800],
  },
  photoHeaderText: {
    color: '#FFFFFF',
  },
  turtleWrap: {
    height: 232,
    alignItems: 'center',
    justifyContent: 'center',
  },
  turtle: {
    width: 174,
    height: 232,
  },
  profileMeta: {
    paddingHorizontal: spacing[16],
    gap: spacing[8],
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[8],
    alignSelf: 'flex-start',
  },
  nameText: {
    ...typography.accent.h2,
    color: gray[800],
  },
  photoNameText: {
    color: '#FFFFFF',
  },
  chipRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  chipGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[8],
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[4],
    height: 36,
    paddingHorizontal: spacing[12],
    backgroundColor: '#FFFFFF',
    borderRadius: radius.full,
  },
  chipText: {
    ...typography.primary.body2B,
    color: green[300],
  },
  cameraButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: gray[100],
    borderRadius: radius.full,
  },
  cameraButtonDisabled: {
    opacity: 0.5,
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
