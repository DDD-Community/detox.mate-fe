import { router } from 'expo-router';
import { Image, StyleSheet, Text, View } from 'react-native';
import { Button } from '../../components/Button';
import { Icon } from '../../components/Icon';
import { primitiveColors, radius, spacing, typography } from '../../lib/token';

const { brown, gray, green, system } = primitiveColors;
const WHITE = '#FFFFFF';
const DAILY_AUTH_BG = '#D5441BCC';
const PROGRESS_BAR_WIDTH = 343;

export type GoalState = 'notSet' | 'setWaiting' | 'authReady';
export type ActionGuideBannerState = GoalState | 'waitingForMembers' | 'deadlineSoon' | 'verified';

interface Props {
  bannerState: ActionGuideBannerState;
  verifyParams?: {
    goal?: string;
    groupChallengeParticipantId?: string;
  };
  summary?: {
    usedMinutes?: number;
    goalMinutes?: number;
  };
}

export default function ActionGuideBanner({ bannerState, verifyParams, summary }: Props) {
  const banner = {
    notSet: <GoalBanner />,
    waitingForMembers: <WaitingForMembersBanner />,
    setWaiting: <GoalSetWaitingBanner />,
    deadlineSoon: <DailyAuthBanner tone="warning" verifyParams={verifyParams} />,
    authReady: <DailyAuthBanner tone="ready" verifyParams={verifyParams} />,
    verified: <VerifiedBanner summary={summary} />,
  }[bannerState];

  return banner;
}

function GoalBanner() {
  return (
    <View style={styles.goalBanner}>
      <View style={styles.topRow}>
        <View style={styles.textContainer}>
          <Text style={styles.goalTitle}>디톡스 첫날이신가요?</Text>
          <Text style={styles.goalSubtitle}>내 평균 스크린 타임을 업로드해보세요!</Text>
        </View>
        <Image
          source={require('../../../assets/feed_daily_calender.png')}
          style={styles.bannerImage}
          resizeMode="contain"
        />
      </View>
      <Button
        label="목표 설정하기"
        leadingIcon={<Icon name="target" size={16} color={WHITE} />}
        color="assistive"
        size="sm"
        onPress={() =>
          router.push({
            pathname: '/(feed)/verify',
            params: { mode: 'initial', verifyRoot: 'feed' },
          })
        }
        style={styles.bannerButton}
      />
    </View>
  );
}

function WaitingForMembersBanner() {
  return (
    <View style={styles.waitingMembersBanner}>
      <View style={styles.waitingMembersTextContainer}>
        <Text style={styles.waitingMembersTitle}>멤버를 기다려주세요</Text>
        <Text style={styles.waitingMembersSubtitle}>
          {'멤버 2명 이상 목표 설정을 해야만\n시작할 수 있어요'}
        </Text>
      </View>
      <Image
        source={require('../../../assets/feed_hourglass.png')}
        style={styles.waitingMembersImage}
        resizeMode="contain"
      />
    </View>
  );
}

function GoalSetWaitingBanner() {
  return (
    <View style={styles.goalBanner}>
      <View style={styles.topRow}>
        <View style={styles.textContainer}>
          <Text style={styles.goalTitle}>지금 이 순간부터 시작됐어요</Text>
          <Text style={styles.goalSubtitle}>
            {'내일부터 스크린 타임을 인증할 수 있어요.\n오늘 하루를 버텨보세요!'}
          </Text>
        </View>
        <Image
          source={require('../../../assets/feed_daily_calender.png')}
          style={styles.bannerImage}
          resizeMode="contain"
        />
      </View>
    </View>
  );
}

function DailyAuthBanner({
  tone,
  verifyParams,
}: Pick<Props, 'verifyParams'> & { tone: 'ready' | 'warning' }) {
  const isWarning = tone === 'warning';

  return (
    <View style={isWarning ? styles.dailyAuthWarningBanner : styles.dailyAuthReadyBanner}>
      <View style={styles.topRow}>
        <View style={styles.textContainer}>
          <Text style={isWarning ? styles.dailyAuthWarningTitle : styles.goalTitle}>
            {isWarning ? '오늘의 인증을 잊지 마세요!' : '어제의 디톡스 인증해볼까요?'}
          </Text>
          <Text style={isWarning ? styles.dailyAuthWarningSubtitle : styles.goalSubtitle}>
            {isWarning ? '인증을 못하면 그룹의 연속 기록이 깨져요' : '친구들이 기다리고 있어요 👀'}
          </Text>
        </View>
        <Image
          source={
            isWarning
              ? require('../../../assets/feed_warning.png')
              : require('../../../assets/feed_bar_chart.png')
          }
          style={styles.bannerImage}
          resizeMode="contain"
        />
      </View>
      <Button
        label="인증하기"
        leadingIcon={
          <Image
            source={require('../../../assets/icon_fl_Camera.png')}
            style={styles.buttonIcon}
            resizeMode="contain"
          />
        }
        color="assistive"
        size="sm"
        onPress={() =>
          router.push({
            pathname: '/(feed)/verify',
            params: {
              mode: 'verify',
              verifyRoot: 'feed',
              ...(verifyParams?.goal ? { goal: verifyParams.goal } : {}),
              ...(verifyParams?.groupChallengeParticipantId
                ? { groupChallengeParticipantId: verifyParams.groupChallengeParticipantId }
                : {}),
            },
          })
        }
        style={styles.bannerButton}
      />
    </View>
  );
}

function VerifiedBanner({ summary }: Pick<Props, 'summary'>) {
  const usedMinutes = summary?.usedMinutes ?? 0;
  const goalMinutes = summary?.goalMinutes ?? 0;
  const hasGoal = goalMinutes > 0;
  const displayMaxMinutes = Math.max(180, Math.ceil(Math.max(usedMinutes, goalMinutes) / 60) * 60);
  const progressRatio = usedMinutes / displayMaxMinutes;
  const markerRatio = hasGoal ? goalMinutes / displayMaxMinutes : 0;
  const progressWidth = Math.max(0, PROGRESS_BAR_WIDTH * progressRatio);
  const markerLeft = Math.max(0, PROGRESS_BAR_WIDTH * markerRatio - 0.5);
  const overGoalPercent = hasGoal ? ((usedMinutes - goalMinutes) / goalMinutes) * 100 : 0;
  const showCompare = hasGoal && Number.isFinite(overGoalPercent) && overGoalPercent > 0;

  return (
    <View style={styles.verifiedBanner}>
      <View style={styles.verifiedHeadingRow}>
        <View>
          <Text style={styles.verifiedLabel}>스크린 타임</Text>
          <Text style={styles.verifiedValue}>총 {formatMinutesForSummary(usedMinutes)}</Text>
        </View>
        {showCompare && (
          <View style={styles.goalComparePill}>
            <Icon name="caretUp" size={12} color={system.red.opacity100} weight="fill" />
            <Text style={styles.goalCompareText}>목표 대비 {overGoalPercent.toFixed(1)}%</Text>
          </View>
        )}
      </View>
      <View style={styles.progressGroup}>
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: progressWidth }]} />
          {hasGoal && <View style={[styles.progressGoalMarker, { left: markerLeft }]} />}
        </View>
        <View style={styles.progressLabels}>
          {buildProgressLabels(displayMaxMinutes).map((label) => (
            <Text key={label} style={styles.progressLabel}>
              {label}
            </Text>
          ))}
        </View>
      </View>
    </View>
  );
}

const formatMinutesForSummary = (minutes: number): string => {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h > 0 && m > 0) return `${h}h ${m}m`;
  if (h > 0) return `${h}h`;
  return `${m}m`;
};

const buildProgressLabels = (maxMinutes: number): string[] => {
  const maxHours = Math.max(3, maxMinutes / 60);
  return Array.from({ length: 4 }, (_, index) => {
    if (index === 0) return '0m';
    const hours = Math.round((maxHours * index) / 3);
    return `${hours}h`;
  });
};

const styles = StyleSheet.create({
  goalBanner: {
    backgroundColor: brown[100],
    minHeight: 233,
    paddingHorizontal: spacing[16],
    paddingTop: spacing[32],
    paddingBottom: spacing[20],
    gap: 18,
  },
  waitingMembersBanner: {
    backgroundColor: brown[100],
    minHeight: 233,
    paddingHorizontal: spacing[16],
    paddingTop: 49,
  },
  dailyAuthReadyBanner: {
    backgroundColor: brown[100],
    minHeight: 233,
    paddingHorizontal: spacing[16],
    paddingTop: spacing[32],
    paddingBottom: spacing[20],
    gap: 18,
  },
  dailyAuthWarningBanner: {
    backgroundColor: DAILY_AUTH_BG,
    minHeight: 233,
    paddingHorizontal: spacing[16],
    paddingTop: spacing[32],
    paddingBottom: spacing[20],
    gap: 18,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing[12],
  },
  textContainer: {
    flex: 1,
    gap: spacing[4],
  },
  waitingMembersTextContainer: {
    width: 201,
    gap: spacing[8],
  },
  goalTitle: {
    ...typography.accent.title2,
    color: gray[900],
  },
  goalSubtitle: {
    ...typography.primary.body3R,
    color: gray[600],
  },
  waitingMembersTitle: {
    ...typography.accent.title2,
    fontSize: 21,
    lineHeight: 27.3,
    letterSpacing: -0.42,
    color: brown[600],
  },
  waitingMembersSubtitle: {
    ...typography.primary.body3R,
    letterSpacing: -0.24,
    color: brown[600],
  },
  dailyAuthWarningTitle: {
    ...typography.accent.title2,
    color: WHITE,
  },
  dailyAuthWarningSubtitle: {
    ...typography.primary.body3R,
    color: WHITE,
  },
  bannerImage: {
    width: 64,
    height: 58,
  },
  waitingMembersImage: {
    position: 'absolute',
    top: 49,
    right: 53,
    width: 51,
    height: 71,
  },
  buttonIcon: {
    width: 16,
    height: 16,
  },
  bannerButton: {
    alignSelf: 'stretch',
  },
  verifiedBanner: {
    backgroundColor: brown[100],
    minHeight: 292,
    paddingHorizontal: spacing[16],
    paddingTop: spacing[28],
    paddingBottom: spacing[20],
    gap: spacing[20],
  },
  verifiedHeadingRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: spacing[12],
  },
  verifiedLabel: {
    ...typography.primary.body3R,
    color: gray[900],
  },
  verifiedValue: {
    ...typography.accent.h1,
    color: gray[900],
    marginTop: spacing[8],
  },
  goalComparePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[4],
    paddingHorizontal: spacing[8],
    paddingVertical: spacing[4],
    borderRadius: radius.full,
    backgroundColor: system.red.opacity10,
  },
  goalCompareText: {
    ...typography.primary.body3R,
    color: system.red.opacity100,
  },
  progressGroup: {
    gap: spacing[4],
  },
  progressTrack: {
    width: PROGRESS_BAR_WIDTH,
    maxWidth: '100%',
    height: 12,
    borderRadius: radius.full,
    backgroundColor: green[300] + '4D',
    overflow: 'visible',
  },
  progressFill: {
    height: 12,
    borderRadius: radius.full,
    backgroundColor: green[300],
  },
  progressGoalMarker: {
    position: 'absolute',
    top: -3,
    width: 1,
    height: 18,
    backgroundColor: green[500],
  },
  progressLabels: {
    width: PROGRESS_BAR_WIDTH,
    maxWidth: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  progressLabel: {
    ...typography.primary.caption,
    color: gray[400],
  },
});
