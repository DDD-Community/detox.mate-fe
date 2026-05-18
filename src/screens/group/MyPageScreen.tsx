import * as ImagePicker from 'expo-image-picker';
import { router, useLocalSearchParams } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { getGroup } from '../../api/generated/group/group';
import { getGroupMember } from '../../api/generated/group-member/group-member';
import { getPoke } from '../../api/generated/poke/poke';
import { getUser } from '../../api/generated/user/user';
import { getUserUsageGoalTime } from '../../api/generated/user-usage-goal-time/user-usage-goal-time';
import type {
  GroupMemberProfileResponse,
  GroupResponse,
  MyProfileResponse,
} from '../../api/generated/model';
import { PresignedUrlRequestUploadPurpose } from '../../api/generated/model';
import { Button } from '../../components/Button';
import { uploadImage } from '../../lib/uploadImage';
import { primitiveColors, radius, spacing, typography } from '../../lib/token';
import { JoinedGroupBody } from './mypage/JoinedGroupBody';
import { ProfileImageBottomSheet } from './mypage/ProfileImageBottomSheet';
import { WeeklyStatusCard } from './mypage/WeeklyStatusCard';

const { brown, gray, green } = primitiveColors;

const ICONS = {
  caretLeft: require('../../../assets/icons/regular/icon_rg_CaretLeft.png'),
  gearSix: require('../../../assets/icons/regular/icon_rg_GearSix.png'),
  pencil: require('../../../assets/icons/regular/icon_rg_PencilSimple.png'),
  camera: require('../../../assets/icons/regular/icon_rg_Camera.png'),
  folder: require('../../../assets/icons/regular/icon_rg_Folder.png'),
  x: require('../../../assets/icons/regular/icon_rg_X.png'),
  info: require('../../../assets/icons/regular/icon_rg_Info.png'),
} as const;

const TURTLE_IMG = require('../../../assets/turtle-hi.png');
// TODO: daily-calendar 전용 에셋 확보 후 교체
const CALENDAR_IMG = require('../../../assets/onboarding-calendar.png');
const GROUP_PLUS_IMG = require('../../../assets/onboarding-group-plus.png');
const GROUP_INVITE_IMG = require('../../../assets/onboarding-group-invite.png');

interface ProfileChipProps {
  label: string;
}

function ProfileChip({ label }: ProfileChipProps) {
  return (
    <View style={styles.chip}>
      <Image source={ICONS.folder} style={styles.chipLeadingIcon} resizeMode="contain" />
      <Text style={styles.chipText} numberOfLines={1}>
        {label}
      </Text>
      <Image source={ICONS.x} style={styles.chipTrailingIcon} resizeMode="contain" />
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

const formatMinutes = (m?: number) => {
  if (m == null) return '0h 00m';
  const safe = Math.max(0, m);
  const h = Math.floor(safe / 60);
  const min = safe % 60;
  return `${h}h ${String(min).padStart(2, '0')}m`;
};

export default function MyPageScreen() {
  // memberId가 있으면 친구 프로필 모드, 없으면 내 마이페이지 모드
  const { memberId, friendName, friendUserId, challengeRecordId, friendHasGoalSet } =
    useLocalSearchParams<{
      memberId?: string;
      friendName?: string;
      friendUserId?: string;
      challengeRecordId?: string;
      friendHasGoalSet?: string;
    }>();
  const isFriend = !!memberId;
  // 친구가 목표를 설정했는지: 쿼리 파라미터 'true'일 때만 true. 미지정/false면 미설정으로 간주.
  const isFriendGoalSet = friendHasGoalSet === 'true';

  const [profile, setProfile] = useState<MyProfileResponse | null>(null);
  const [hasGoalSet, setHasGoalSet] = useState(false);
  const [group, setGroup] = useState<GroupResponse | null>(null);
  const [memberProfile, setMemberProfile] = useState<GroupMemberProfileResponse | null>(null);
  const [isLoading, setIsLoading] = useState(!isFriend);

  const [isPoking, setIsPoking] = useState(false);

  const [isImageSheetOpen, setIsImageSheetOpen] = useState(false);
  // null이면 기본 이미지(추후 서버가 내려주는 기본 S3 URL로 대체), 그 외엔 사용자 이미지 URL/URI
  const [profileImageUri, setProfileImageUri] = useState<string | null>(null);
  const [isUpdatingProfileImage, setIsUpdatingProfileImage] = useState(false);

  const getCurrentUserParam = async () => {
    const userIdStr = await SecureStore.getItemAsync('currentUserId');
    return { currentUser: { id: userIdStr ? Number(userIdStr) : undefined } };
  };

  useEffect(() => {
    if (isFriend) return;
    let cancelled = false;
    (async () => {
      try {
        const userParam = await getCurrentUserParam();
        const [me, goalsResponse, myGroups] = await Promise.all([
          getUser().getMe(userParam),
          getUserUsageGoalTime().getCurrentGoalTimes(userParam),
          getGroup().getMyGroups(userParam),
        ]);
        if (cancelled) return;

        setProfile(me);
        setProfileImageUri(me.profileImageUrl ?? null);
        setHasGoalSet((goalsResponse.goals?.length ?? 0) > 0);

        const firstGroup = myGroups?.[0];
        if (!firstGroup?.id || !me.id) return;

        const groupData = await getGroup().getGroup(firstGroup.id, userParam);
        if (cancelled) return;
        setGroup(groupData);

        const myMember = groupData.members?.find((m) => m.userId === me.id);
        if (!myMember?.id) return;

        const profileData = await getGroupMember().getGroupMemberProfile(
          firstGroup.id,
          myMember.id,
          userParam,
        );
        if (cancelled) return;
        setMemberProfile(profileData);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [isFriend]);

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
    setIsImageSheetOpen(true);
  };

  const handleSelectDefaultImage = async () => {
    setIsImageSheetOpen(false);
    if (isUpdatingProfileImage) return;
    const previous = profileImageUri;
    setProfileImageUri(null);
    setIsUpdatingProfileImage(true);
    try {
      // 기본 이미지 복귀: 빈 문자열로 objectKey 클리어. 서버가 응답에 기본 S3 URL을 채워 내려줌.
      const response = await getUser().updateMe(
        { profileImageObjectKey: '' },
        await getCurrentUserParam()
      );
      setProfileImageUri(response.profileImageUrl ?? null);
    } catch (e) {
      setProfileImageUri(previous);
      // TODO: 에러 토스트
    } finally {
      setIsUpdatingProfileImage(false);
    }
  };

  const handleSelectGalleryImage = async () => {
    setIsImageSheetOpen(false);
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 1,
      allowsEditing: true,
    });
    if (result.canceled || !result.assets[0]) return;
    if (isUpdatingProfileImage) return;

    const asset = result.assets[0];
    const previous = profileImageUri;
    setProfileImageUri(asset.uri);
    setIsUpdatingProfileImage(true);
    try {
      const objectKey = await uploadImage(asset.uri, {
        uploadPurpose: PresignedUrlRequestUploadPurpose.PROFILE_IMAGE,
        fileName: asset.fileName,
        mimeType: asset.mimeType,
        fileSize: asset.fileSize,
      });
      const response = await getUser().updateMe(
        { profileImageObjectKey: objectKey },
        await getCurrentUserParam()
      );
      setProfileImageUri(response.profileImageUrl ?? asset.uri);
    } catch (e) {
      setProfileImageUri(previous);
      // TODO: 에러 토스트
    } finally {
      setIsUpdatingProfileImage(false);
    }
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

  const handleGroupPress = () => {
    router.push({
      pathname: '/(group)/group-info',
      params: group?.id != null ? { groupId: String(group.id) } : undefined,
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
      await getPoke().pokeUser(
        Number(challengeRecordId),
        Number(friendUserId),
        await getCurrentUserParam(),
      );
    } finally {
      setIsPoking(false);
    }
  };

  // 본인 모드 파생값
  const displayName = isFriend
    ? friendName ?? '친구'
    : profile?.displayName ?? '';
  const dayCount = isFriend ? 27 : memberProfile?.activitySummary?.dayCount ?? 0;
  const achievementRate = isFriend
    ? 0
    : memberProfile?.activitySummary?.achievementRate ?? 0;
  const hasJoinedGroup = !!group;

  const weekly = memberProfile?.weeklySummary;
  const avgScreenTime = formatMinutes(weekly?.averageUsedMinutes);
  const goalScreenTime = formatMinutes(weekly?.goalMinutes);
  const diffMinutes = weekly?.differenceMinutes ?? 0;
  const certifiedDays = weekly?.certifiedDays ?? 0;
  const totalVerifyDays = weekly?.totalDays ?? 7;
  const achievedDays = weekly?.achievedDays ?? 0;
  const groupMembers = (group?.members ?? []).map((m) => ({
    name: m.displayName ?? '',
  }));
  const groupName = group?.name ?? '';
  const daysUntilGoalChange =
    memberProfile?.goalChangeAvailability?.remainingDays ?? 0;

  return (
    <View style={styles.root}>
      <View style={styles.profileCard}>
        <SafeAreaView edges={['top']}>
          <View style={styles.header}>
            <Pressable onPress={handleBack} hitSlop={8} style={styles.headerLeft}>
              <Image source={ICONS.caretLeft} style={styles.headerIcon} resizeMode="contain" />
              <Text style={styles.headerTitle}>{isFriend ? displayName : '마이페이지'}</Text>
            </Pressable>
            {!isFriend && (
              <Pressable onPress={handleSettings} hitSlop={8}>
                <Image source={ICONS.gearSix} style={styles.headerIcon} resizeMode="contain" />
              </Pressable>
            )}
          </View>
        </SafeAreaView>

        <View style={styles.turtleWrap}>
          {profileImageUri && !isFriend ? (
            <Image
              source={{ uri: profileImageUri }}
              style={styles.profilePhoto}
              resizeMode="cover"
            />
          ) : (
            <Image source={TURTLE_IMG} style={styles.turtle} resizeMode="contain" />
          )}
        </View>

        <View style={styles.profileMeta}>
          {isFriend ? (
            <View style={styles.nameRow}>
              <Text style={styles.nameText}>{displayName}</Text>
            </View>
          ) : (
            <Pressable onPress={handleEditName} style={styles.nameRow} hitSlop={8}>
              <Text style={styles.nameText}>{displayName}</Text>
              <Image source={ICONS.pencil} style={styles.smallIcon} resizeMode="contain" />
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
                style={[styles.cameraButton, isUpdatingProfileImage && styles.cameraButtonDisabled]}
                hitSlop={8}
              >
                <Image source={ICONS.camera} style={styles.cameraIcon} resizeMode="contain" />
              </Pressable>
            )}
          </View>
        </View>
      </View>

      {isFriend && !isFriendGoalSet ? (
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
            diffMinutes={-30}
            avgScreenTime="1h 30m"
            goalScreenTime="2h 00m"
            verifiedDays={5}
            totalVerifyDays={7}
            achievedDays={3}
            achievableDays={5}
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
          groupMembers={groupMembers}
          groupName={groupName}
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
              label="목표 스크린타임 설정"
              color="assistive"
              onPress={handleSetGoal}
              leadingIcon={
                <Image source={ICONS.info} style={styles.ctaIcon} resizeMode="contain" />
              }
              trailingIcon={
                <Image source={ICONS.info} style={styles.ctaIcon} resizeMode="contain" />
              }
              style={styles.cta}
            />
          </SafeAreaView>
        </>
      )}

      <ProfileImageBottomSheet
        visible={isImageSheetOpen}
        onClose={() => setIsImageSheetOpen(false)}
        onSelectDefault={handleSelectDefaultImage}
        onSelectGallery={handleSelectGalleryImage}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: brown[50],
  },
  profileCard: {
    backgroundColor: brown[100],
    borderBottomLeftRadius: spacing[20],
    borderBottomRightRadius: spacing[20],
    paddingBottom: spacing[16],
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
  headerIcon: {
    width: 24,
    height: 24,
  },
  headerTitle: {
    ...typography.accent.title2,
    color: gray[800],
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
  profilePhoto: {
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: '#FFFFFF',
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
  smallIcon: {
    width: 16,
    height: 16,
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
  chipLeadingIcon: {
    width: 14,
    height: 14,
  },
  chipTrailingIcon: {
    width: 12,
    height: 12,
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
  cameraIcon: {
    width: 20,
    height: 20,
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
  ctaIcon: {
    width: 16,
    height: 16,
    tintColor: '#FFFFFF',
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
