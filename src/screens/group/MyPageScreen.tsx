import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '../../components/Button';
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

export default function MyPageScreen() {
  // memberId가 있으면 친구 프로필 모드, 없으면 내 마이페이지 모드
  const { memberId, friendName } = useLocalSearchParams<{
    memberId?: string;
    friendName?: string;
  }>();
  const isFriend = !!memberId;

  // TODO: API 연동 — isFriend ? GET /groups/{groupId}/members/{memberId} : GET /users/me
  const displayName = isFriend ? friendName ?? '친구' : '지민';
  const dayCount = 27;
  const achievementRate = 0;
  // TODO: GET /me/usage-goal-times/current 응답으로 판단
  const hasGoalSet = true;
  // TODO: GET /me/groups 응답으로 판단
  const hasJoinedGroup = true;

  const [isImageSheetOpen, setIsImageSheetOpen] = useState(false);

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

  const handleSelectDefaultImage = () => {
    setIsImageSheetOpen(false);
    // TODO: 기본 이미지로 변경 — PATCH /users/me { profileImageObjectKey: null }
  };

  const handleSelectGalleryImage = () => {
    setIsImageSheetOpen(false);
    // TODO: 갤러리 이미지 선택 → POST /uploads/presigned-urls → 업로드 → PATCH /users/me
  };

  const handleSetGoal = () => {
    // TODO: 목표 스크린타임 설정 화면 이동
  };

  const handleCreateGroup = () => {
    // TODO: 새 그룹 만들기 화면 이동
  };

  const handleEnterInviteCode = () => {
    // TODO: 초대 코드 입력 화면 이동
  };

  const handleGroupPress = () => {
    router.push('/(group)/group-info');
  };

  const handleChangeGoal = () => {
    router.push('/(group)/goal-time-edit');
  };

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
          <Image source={TURTLE_IMG} style={styles.turtle} resizeMode="contain" />
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
              <Pressable onPress={handleEditProfileImage} style={styles.cameraButton} hitSlop={8}>
                <Image source={ICONS.camera} style={styles.cameraIcon} resizeMode="contain" />
              </Pressable>
            )}
          </View>
        </View>
      </View>

      {isFriend ? (
        <View style={styles.friendBody}>
          <WeeklyStatusCard
            weekLabel="4월 4주"
            diffMinutes={-30}
            avgScreenTime="1h 30m"
            goalScreenTime="2h 00m"
            verifiedDays={5}
            totalVerifyDays={7}
            achievedDays={3}
            achievableDays={5}
          />
        </View>
      ) : hasGoalSet && hasJoinedGroup ? (
        <JoinedGroupBody
          weekLabel="4월 4주"
          diffMinutes={-30}
          avgScreenTime="1h 30m"
          goalScreenTime="2h 00m"
          verifiedDays={5}
          totalVerifyDays={7}
          achievedDays={3}
          achievableDays={5}
          groupMembers={[{ name: '지민' }, { name: '수진' }, { name: '혜진' }]}
          groupName="{Group Name}"
          daysUntilGoalChange={8}
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
  cameraIcon: {
    width: 20,
    height: 20,
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
});
