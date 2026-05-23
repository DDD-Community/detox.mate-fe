import * as ImagePicker from 'expo-image-picker';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import { useCallback, useState } from 'react';
import { ActivityIndicator, Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
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

import iconCaretLeft from '../../../assets/icons/regular/icon_rg_CaretLeft.png';
import iconCamera from '../../../assets/icons/regular/icon_rg_Camera.png';
import iconGearSix from '../../../assets/icons/regular/icon_rg_GearSix.png';
import iconPencil from '../../../assets/icons/regular/icon_rg_PencilSimple.png';
import CALENDAR_IMG from '../../../assets/mypage-calender.png';
import GROUP_INVITE_IMG from '../../../assets/onboarding-group-invite.png';
import GROUP_PLUS_IMG from '../../../assets/onboarding-group-plus.png';
import TURTLE_IMG from '../../../assets/turtle-hi.png';

const { brown, gray, green } = primitiveColors;

const ICONS = {
  caretLeft: iconCaretLeft,
  gearSix: iconGearSix,
  pencil: iconPencil,
  camera: iconCamera,
} as const;

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

const formatMinutes = (m?: number) => {
  if (m == null) return '0h 00m';
  const safe = Math.max(0, m);
  const h = Math.floor(safe / 60);
  const min = safe % 60;
  return `${h}h ${String(min).padStart(2, '0')}m`;
};

export default function MyPageScreen() {
  // memberId가 있으면 친구 프로필 모드, 없으면 내 마이페이지 모드
  const {
    memberId,
    friendName,
    friendUserId,
    challengeRecordId,
    friendGroupId,
  } = useLocalSearchParams<{
    memberId?: string;
    friendName?: string;
    friendUserId?: string;
    challengeRecordId?: string;
    friendGroupId?: string;
  }>();
  const isFriend = !!memberId;

  const [profile, setProfile] = useState<MyProfileResponse | null>(null);
  const [hasGoalSet, setHasGoalSet] = useState(false);
  const [group, setGroup] = useState<GroupResponse | null>(null);
  const [groups, setGroups] = useState<GroupResponse[]>([]);
  const [memberProfile, setMemberProfile] = useState<GroupMemberProfileResponse | null>(null);
  const [friendProfile, setFriendProfile] = useState<GroupMemberProfileResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const [isPoking, setIsPoking] = useState(false);

  const [isImageSheetOpen, setIsImageSheetOpen] = useState(false);
  // null이면 기본 이미지(추후 서버가 내려주는 기본 S3 URL로 대체), 그 외엔 사용자 이미지 URL/URI
  const [profileImageUri, setProfileImageUri] = useState<string | null>(null);
  const [isUpdatingProfileImage, setIsUpdatingProfileImage] = useState(false);

  const getCurrentUserParam = async () => {
    const userIdStr = await SecureStore.getItemAsync('currentUserId');
    return { currentUser: { id: userIdStr ? Number(userIdStr) : undefined } };
  };

  // 첫 진입 시에만 ActivityIndicator를 노출. 화면 복귀 시(refresh)는 백그라운드로 갱신.
  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      (async () => {
        try {
          const userParam = await getCurrentUserParam();
          if (isFriend) {
            const groupIdNum = friendGroupId ? Number(friendGroupId) : NaN;
            const memberIdNum = memberId ? Number(memberId) : NaN;
            if (Number.isFinite(groupIdNum) && Number.isFinite(memberIdNum)) {
              const data = await getGroupMember().getGroupMemberProfile(
                groupIdNum,
                memberIdNum,
                userParam,
              );
              if (cancelled) return;
              setFriendProfile(data);
            }
            return;
          }

          const [me, goalsResponse, myGroups] = await Promise.all([
            getUser().getMe(userParam),
            getUserUsageGoalTime().getCurrentGoalTimes(userParam),
            getGroup().getMyGroups(userParam),
          ]);
          if (cancelled) return;

          setProfile(me);
          setProfileImageUri(me.profileImageUrl ?? null);
          setHasGoalSet((goalsResponse.goals?.length ?? 0) > 0);

          const groupIds = (myGroups ?? [])
            .map((item) => item.id)
            .filter((id): id is number => id != null);
          const groupDetails = await Promise.all(
            groupIds.map((groupId) => getGroup().getGroup(groupId, userParam)),
          );
          if (cancelled) return;
          setGroups(groupDetails);

          const firstGroup = groupDetails[0];
          if (!firstGroup?.id || !me.id) {
            setGroup(null);
            setMemberProfile(null);
            return;
          }

          setGroup(firstGroup);

          const myMember = firstGroup.members?.find((m) => m.userId === me.id);
          if (!myMember?.id) {
            setMemberProfile(null);
            return;
          }

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
    }, [isFriend, friendGroupId, memberId]),
  );

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
      // 기본 이미지 복귀: objectKey를 null로 명시해 클리어. 서버가 응답에 기본 S3 URL을 채워 내려줌.
      const response = await getUser().updateMe(
        { profileImageObjectKey: null as unknown as string },
        await getCurrentUserParam()
      );
      // eslint-disable-next-line no-console
      console.log('[default-image] response', response);
      setProfileImageUri(response.profileImageUrl ?? null);
    } catch (e) {
      // eslint-disable-next-line no-console
      console.log('[default-image] failed', (e as { response?: { data?: unknown } })?.response?.data ?? e);
      setProfileImageUri(previous);
      // TODO: 에러 토스트
    } finally {
      setIsUpdatingProfileImage(false);
    }
  };

  const handleSelectGalleryImage = async () => {
    setIsImageSheetOpen(false);
    // iOS Modal dismiss animation이 끝나기 전에 native picker를 띄우면
    // presentation 충돌로 picker가 즉시 닫혀버림. 짧게 대기.
    await new Promise<void>((resolve) => setTimeout(resolve, 300));

    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) return;

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
      await getPoke().pokeUser(
        Number(challengeRecordId),
        Number(friendUserId),
        await getCurrentUserParam(),
      );
    } finally {
      setIsPoking(false);
    }
  };

  // 현재 모드에 따른 데이터 소스
  const activeProfile = isFriend ? friendProfile : memberProfile;
  const isFriendGoalSet = (friendProfile?.currentGoals?.length ?? 0) > 0;

  const displayName = isFriend
    ? friendProfile?.displayName ?? friendName ?? '친구'
    : profile?.displayName ?? '';
  const dayCount = activeProfile?.activitySummary?.dayCount ?? 0;
  const achievementRate = activeProfile?.activitySummary?.achievementRate ?? 0;
  const hasJoinedGroup = groups.length > 0;

  const weekly = activeProfile?.weeklySummary;
  const avgScreenTime = formatMinutes(weekly?.averageUsedMinutes);
  const goalScreenTime = formatMinutes(weekly?.goalMinutes);
  const diffMinutes = weekly?.differenceMinutes ?? 0;
  const certifiedDays = weekly?.certifiedDays ?? 0;
  const totalVerifyDays = weekly?.totalDays ?? 7;
  const achievedDays = weekly?.achievedDays ?? 0;
  const joinedGroups = groups.map((item) => ({
    id: item.id,
    name: item.name ?? '',
    members: (item.members ?? []).map((m) => ({
      name: m.displayName ?? '',
    })),
  }));
  const daysUntilGoalChange =
    memberProfile?.goalChangeAvailability?.remainingDays ?? 0;

  // 표시할 프로필 이미지: 친구 모드면 친구 응답, 본인 모드면 로컬 state(낙관적 업데이트 + 서버 응답)
  const displayProfileImageUri = isFriend
    ? friendProfile?.profileImageUrl ?? null
    : profileImageUri;
  const hasProfileBackground = Boolean(displayProfileImageUri);

  return (
    <View style={styles.root}>
      <ScrollView
        style={styles.screenScroll}
        contentContainerStyle={styles.screenContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.profileCard}>
          {displayProfileImageUri ? (
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
                <Image
                  source={ICONS.caretLeft}
                  style={[styles.headerIcon, hasProfileBackground && styles.photoHeaderIcon]}
                  resizeMode="contain"
                />
                <Text style={[styles.headerTitle, hasProfileBackground && styles.photoHeaderText]}>
                  {isFriend ? displayName : '마이페이지'}
                </Text>
              </Pressable>
              {!isFriend && (
                <Pressable onPress={handleSettings} hitSlop={8}>
                  <Image
                    source={ICONS.gearSix}
                    style={[styles.headerIcon, hasProfileBackground && styles.photoHeaderIcon]}
                    resizeMode="contain"
                  />
                </Pressable>
              )}
            </View>
          </SafeAreaView>

          <View style={styles.turtleWrap}>
            {!displayProfileImageUri && (
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
                <Image
                  source={ICONS.pencil}
                  style={[styles.smallIcon, hasProfileBackground && styles.photoHeaderIcon]}
                  resizeMode="contain"
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
                  style={[styles.cameraButton, isUpdatingProfileImage && styles.cameraButtonDisabled]}
                  hitSlop={8}
                >
                  <Image source={ICONS.camera} style={styles.cameraIcon} resizeMode="contain" />
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
                label="목표 스크린타임 설정"
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
  headerIcon: {
    width: 24,
    height: 24,
  },
  photoHeaderIcon: {
    tintColor: '#FFFFFF',
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
