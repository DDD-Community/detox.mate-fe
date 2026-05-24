import { ActivityIndicator, Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/components';
import { primitiveColors, radius, spacing, typography } from '@/lib/token';
import { JoinedGroupBody, type JoinedGroupItem } from './JoinedGroupBody';
import { WeeklyStatusCard } from './WeeklyStatusCard';

import CALENDAR_IMG from '@assets/mypage-calender.png';
import GROUP_INVITE_IMG from '@assets/onboarding-group-invite.png';
import GROUP_PLUS_IMG from '@assets/onboarding-group-plus.png';

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

interface MyPageBodyProps {
  isFriend: boolean;
  isLoading: boolean;
  isFriendGoalSet: boolean;
  isPoking: boolean;
  hasGoalSet: boolean;
  hasJoinedGroup: boolean;
  diffMinutes: number;
  avgScreenTime: string;
  goalScreenTime: string;
  certifiedDays: number;
  totalVerifyDays: number;
  achievedDays: number;
  joinedGroups: JoinedGroupItem[];
  daysUntilGoalChange: number;
  onPoke: () => void;
  onSetGoal: () => void;
  onCreateGroup: () => void;
  onEnterInviteCode: () => void;
  onGroupPress: (groupId?: number) => void;
  onChangeGoal: () => void;
}

export function MyPageBody({
  isFriend,
  isLoading,
  isFriendGoalSet,
  isPoking,
  hasGoalSet,
  hasJoinedGroup,
  diffMinutes,
  avgScreenTime,
  goalScreenTime,
  certifiedDays,
  totalVerifyDays,
  achievedDays,
  joinedGroups,
  daysUntilGoalChange,
  onPoke,
  onSetGoal,
  onCreateGroup,
  onEnterInviteCode,
  onGroupPress,
  onChangeGoal,
}: MyPageBodyProps) {
  if (isFriend && isLoading) {
    return (
      <View style={styles.loadingWrap}>
        <ActivityIndicator color={gray[400]} />
      </View>
    );
  }

  if (isFriend && !isFriendGoalSet) {
    return (
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
            onPress={onPoke}
            style={styles.pokeCta}
          />
        </SafeAreaView>
      </>
    );
  }

  if (isFriend) {
    return (
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
    );
  }

  if (isLoading) {
    return (
      <View style={styles.loadingWrap}>
        <ActivityIndicator color={gray[400]} />
      </View>
    );
  }

  if (hasGoalSet && hasJoinedGroup) {
    return (
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
        onGroupPress={onGroupPress}
        onGoalChangePress={onChangeGoal}
      />
    );
  }

  if (hasGoalSet) {
    return (
      <View style={styles.goalSetBody}>
        <View style={styles.actionCardRow}>
          <GroupActionCard
            image={GROUP_PLUS_IMG}
            imageWidth={30}
            imageHeight={29}
            label="새 그룹 만들기"
            onPress={onCreateGroup}
          />
          <GroupActionCard
            image={GROUP_INVITE_IMG}
            imageWidth={42}
            imageHeight={29}
            label="초대 코드 입력"
            onPress={onEnterInviteCode}
          />
        </View>
        <Text style={styles.actionHelperText}>새 그룹을 만들거나 친구가 만든 그룹에 입장해요</Text>
      </View>
    );
  }

  return (
    <>
      <View style={styles.emptyState}>
        <Image source={CALENDAR_IMG} style={styles.calendar} resizeMode="contain" />
        <Text style={styles.emptyText}>목표 설정을 해야 참여할 수 있어요.</Text>
      </View>

      <SafeAreaView edges={['bottom']} style={styles.ctaWrap}>
        <Button
          label="목표 스크린 타임 설정"
          color="assistive"
          onPress={onSetGoal}
          style={styles.cta}
        />
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
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
