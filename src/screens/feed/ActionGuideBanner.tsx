import { router } from 'expo-router';
import { Image, StyleSheet, Text, View } from 'react-native';
import { Button } from '../../components/Button';
import { primitiveColors, spacing, typography } from '../../lib/token';

const { brown, gray, system } = primitiveColors;
const WHITE = '#FFFFFF';

export type GoalState = 'notSet' | 'setWaiting' | 'authReady';

interface Props {
  goalState: GoalState;
}

export default function ActionGuideBanner({ goalState }: Props) {
  const banner = {
    notSet: <GoalBanner />,
    setWaiting: <GoalSetWaitingBanner />,
    authReady: <DailyAuthBanner />,
  }[goalState];

  return banner;
}

function GoalBanner() {
  return (
    <View style={styles.goalBanner}>
      <View style={styles.topRow}>
        <View style={styles.textContainer}>
          <Text style={styles.goalTitle}>디톡스 첫날이신가요?</Text>
          <Text style={styles.goalSubtitle}>내 평균 스크린타임을 업로드해보세요!</Text>
        </View>
        <Image
          source={require('../../../assets/daily-calendar.png')}
          style={styles.bannerImage}
          resizeMode="contain"
        />
      </View>
      <Button
        label="목표 설정하기"
        leadingIcon={
          <Image
            source={require('../../../assets/icons/regular/icon_rg_Target.png')}
            style={styles.buttonIcon}
            resizeMode="contain"
          />
        }
        color="assistive"
        size="lg"
        onPress={() => router.push('/(group)/goal')}
        style={{ alignSelf: 'stretch' }}
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
            {'내일부터 스크린타임을 인증할 수 있어요.\n오늘 하루를 버텨보세요!'}
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

function DailyAuthBanner() {
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
        size="lg"
        onPress={() => router.push('/(group)/verify')}
        style={{ alignSelf: 'stretch' }}
      />
    </View>
  );
}


const styles = StyleSheet.create({
  goalBanner: {
    backgroundColor: brown[100],
    padding: spacing[20],
    gap: spacing[12],
  },
  dailyAuthBanner: {
    backgroundColor: system.red.opacity100,
    padding: spacing[28],
    gap: spacing[12],
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
    ...typography.primary.body1B,
    color: gray[900],
  },
  goalSubtitle: {
    ...typography.primary.body2R,
    color: gray[600],
  },
  dailyAuthTitle: {
    ...typography.primary.body1B,
    color: WHITE,
  },
  dailyAuthSubtitle: {
    ...typography.primary.body2R,
    color: WHITE,
  },
  bannerImage: {
    width: 64,
    height: 64,
  },
  buttonIcon: {
    width: 20,
    height: 20,
  },
});
