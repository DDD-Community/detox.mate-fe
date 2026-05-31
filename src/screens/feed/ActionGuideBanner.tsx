import { router } from 'expo-router';
import { Image, StyleSheet, Text, View } from 'react-native';
import { Button } from '../../components/Button';
import { Icon } from '../../components/Icon';
import { primitiveColors, spacing, typography } from '../../lib/token';

const { brown, gray } = primitiveColors;
const WHITE = '#FFFFFF';
const DAILY_AUTH_BG = '#D5441BCC';

export type GoalState = 'notSet' | 'setWaiting' | 'authReady';

interface Props {
  goalState: GoalState;
  verifyParams?: {
    goal?: string;
    groupChallengeParticipantId?: string;
  };
}

export default function ActionGuideBanner({ goalState, verifyParams }: Props) {
  const banner = {
    notSet: <GoalBanner />,
    setWaiting: <GoalSetWaitingBanner />,
    authReady: <DailyAuthBanner verifyParams={verifyParams} />,
  }[goalState];

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
          source={require('../../../assets/daily-calendar.png')}
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
            pathname: '/verify',
            params: { mode: 'initial', verifyRoot: 'root' },
          })
        }
        style={styles.bannerButton}
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
          source={require('../../../assets/daily-calendar.png')}
          style={styles.bannerImage}
          resizeMode="contain"
        />
      </View>
    </View>
  );
}

function DailyAuthBanner({ verifyParams }: Pick<Props, 'verifyParams'>) {
  return (
    <View style={styles.dailyAuthBanner}>
      <View style={styles.topRow}>
        <View style={styles.textContainer}>
          <Text style={styles.dailyAuthTitle}>오늘의 인증을 잊지 마세요!</Text>
          <Text style={styles.dailyAuthSubtitle}>인증을 못하면 그룹의 연속 기록이 깨져요</Text>
        </View>
        <Image
          source={require('../../../assets/warning.png')}
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
            pathname: '/verify',
            params: {
              mode: 'verify',
              verifyRoot: 'root',
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

const styles = StyleSheet.create({
  goalBanner: {
    backgroundColor: brown[100],
    minHeight: 233,
    paddingHorizontal: spacing[16],
    paddingTop: spacing[32],
    paddingBottom: spacing[20],
    gap: 18,
  },
  dailyAuthBanner: {
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
  goalTitle: {
    ...typography.accent.title2,
    color: gray[900],
  },
  goalSubtitle: {
    ...typography.primary.body3R,
    color: gray[600],
  },
  dailyAuthTitle: {
    ...typography.accent.title2,
    color: WHITE,
  },
  dailyAuthSubtitle: {
    ...typography.primary.body3R,
    color: WHITE,
  },
  bannerImage: {
    width: 64,
    height: 58,
  },
  buttonIcon: {
    width: 16,
    height: 16,
  },
  bannerButton: {
    alignSelf: 'stretch',
  },
});
