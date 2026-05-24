import { router, useLocalSearchParams } from 'expo-router';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';

import ONBOARDING_CHECK_IMAGE from '@assets/onboarding-check.png';

import { Button, Icon } from '@/components';
import { submitTotalUsageActivityRecord } from '@/features/activity-record/submitTotalUsageActivityRecord';
import { primitiveColors, typography } from '@/lib/token';
import { VerifyBottomSheet } from './VerifyBottomSheet';
import { buildVerifyValueParams, type VerifyMode } from './verifyFlowParams';
import { formatHHMMToDisplay, formatMinutesDiff, parseHHMMToMinutes } from './verifyTime';

const { gray, brown, green, system } = primitiveColors;

export default function VerifyDoneScreen() {
  const { value, mode, goal, groupChallengeParticipantId } = useLocalSearchParams<{
    value?: string;
    mode?: VerifyMode;
    goal?: string;
    groupChallengeParticipantId?: string;
  }>();
  const display = formatHHMMToDisplay(value);
  const isVerifyMode = mode === 'verify';
  const valueMinutes = parseHHMMToMinutes(value);
  const goalMinutes = parseHHMMToMinutes(goal);
  const hasGoal = goalMinutes !== null && valueMinutes !== null;
  const goalAchieved = hasGoal ? valueMinutes! <= goalMinutes! : true;
  const diffText = hasGoal && goalAchieved ? formatMinutesDiff(goalMinutes! - valueMinutes!) : '';

  const handleSetGoal = () => {
    router.replace({
      pathname: '/(group)/goal',
      params: value ? { value } : undefined,
    });
  };

  const handleSkip = async () => {
    if (isVerifyMode) {
      await submitTotalUsageActivityRecord({
        value,
        groupChallengeParticipantId,
      });
    }
    router.replace('/(group)/verify/complete');
  };

  const handlePostFeed = () => {
    router.replace({
      pathname: '/(group)/post',
      params: buildVerifyValueParams({ value, groupChallengeParticipantId }),
    });
  };

  const handleReportWrongTime = () => {
    router.push({
      pathname: '/(group)/verify/wrong-time',
      params: { achieved: goalAchieved ? '1' : '0' },
    });
  };

  const handleRecordRetro = () => {
    router.replace({
      pathname: '/(group)/verify/retro',
      params: buildVerifyValueParams({ value, groupChallengeParticipantId }),
    });
  };

  if (!isVerifyMode) {
    return (
      <VerifyBottomSheet onDismiss={() => router.back()}>
        <View style={styles.content}>
          <View style={styles.heading}>
            <Image source={ONBOARDING_CHECK_IMAGE} style={styles.checkIcon} resizeMode="contain" />
            <Text style={styles.title}>분석 완료 !</Text>
          </View>

          <View style={styles.summary}>
            <Text style={styles.summaryLabel}>내 스크린 타임</Text>
            <Text style={styles.summaryValue}>{display}</Text>
          </View>

          <Button
            label="개인 목표 설정하기"
            color="primary"
            onPress={handleSetGoal}
            style={styles.button}
          />
        </View>
      </VerifyBottomSheet>
    );
  }

  return (
    <VerifyBottomSheet onDismiss={() => router.back()}>
      <View style={styles.verifyContent}>
        <View style={styles.heading}>
          <Image source={ONBOARDING_CHECK_IMAGE} style={styles.checkIcon} resizeMode="contain" />
          <Text style={styles.verifyTitle}>{'어제의 스크린 타임\n분석 완료 !'}</Text>
        </View>

        <View style={styles.verifySummaryGroup}>
          <View style={goalAchieved ? styles.verifySummary : styles.verifySummaryMissed}>
            <Text
              style={goalAchieved ? styles.verifySummaryLabel : styles.verifySummaryLabelMissed}
            >
              내 스크린 타임
            </Text>
            <Text
              style={goalAchieved ? styles.verifySummaryValue : styles.verifySummaryValueMissed}
            >
              {goalAchieved ? display : `총 ${display}`}
            </Text>
          </View>
          <View style={styles.goalCompareRow}>
            <Icon
              name="checkCircle"
              size={20}
              weight={goalAchieved ? 'regular' : 'fill'}
              color={goalAchieved ? green[300] : system.red.opacity100}
            />
            <Text style={goalAchieved ? styles.goalCompareText : styles.goalCompareTextMissed}>
              {goalAchieved
                ? diffText
                  ? `좋아요, 목표보다 ${diffText} 덜 썼어요!`
                  : '좋아요, 분석을 완료했어요!'
                : '목표를 미달성 했어요, 조금만 더 힘내보아요!'}
            </Text>
          </View>
        </View>

        {goalAchieved ? (
          <View style={styles.actionGroup}>
            <View style={styles.actionRow}>
              <Pressable style={styles.skipButton} onPress={handleSkip}>
                <Text style={styles.skipButtonLabel}>건너뛰기</Text>
              </Pressable>
              <Pressable style={styles.postButton} onPress={handlePostFeed}>
                <Text style={styles.postButtonLabel}>게시물 올리기</Text>
              </Pressable>
            </View>
            <Pressable style={styles.reportButton} onPress={handleReportWrongTime}>
              <Text style={styles.reportButtonLabel}>시간이 틀려요</Text>
            </Pressable>
          </View>
        ) : (
          <View style={styles.actionGroup}>
            <Pressable style={styles.recordButton} onPress={handleRecordRetro}>
              <Text style={styles.recordButtonLabel}>회고 기록하기</Text>
            </Pressable>
            <Pressable style={styles.reportButton} onPress={handleReportWrongTime}>
              <Text style={styles.reportButtonLabel}>시간이 틀려요</Text>
            </Pressable>
          </View>
        )}
      </View>
    </VerifyBottomSheet>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: 40,
  },
  heading: {
    alignItems: 'center',
    gap: 12,
  },
  checkIcon: {
    width: 60,
    height: 60,
  },
  title: {
    ...typography.accent.h3,
    color: gray[900],
    textAlign: 'center',
    letterSpacing: -0.52,
  },
  summary: {
    backgroundColor: gray[50],
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  summaryLabel: {
    ...typography.primary.body3R,
    color: gray[500],
    letterSpacing: -0.24,
  },
  summaryValue: {
    ...typography.primary.body1B,
    color: gray[500],
    letterSpacing: -0.32,
  },
  button: {
    alignSelf: 'stretch',
  },
  verifyContent: {
    gap: 40,
  },
  verifyTitle: {
    ...typography.accent.h3,
    color: '#2B2F38',
    textAlign: 'center',
    letterSpacing: -0.52,
  },
  verifySummaryGroup: {
    gap: 12,
  },
  verifySummary: {
    backgroundColor: system.green.opacity10,
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  verifySummaryLabel: {
    ...typography.primary.body3R,
    color: system.green.opacity100,
    letterSpacing: -0.24,
  },
  verifySummaryValue: {
    ...typography.primary.body1B,
    color: system.green.opacity100,
    letterSpacing: -0.32,
  },
  goalCompareRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  goalCompareIcon: {
    width: 16,
    height: 16,
    tintColor: system.green.opacity100,
  },
  goalCompareIconMissed: {
    width: 16,
    height: 16,
    tintColor: gray[500],
  },
  goalCompareText: {
    ...typography.accent.body3,
    color: system.green.opacity100,
    letterSpacing: -0.28,
  },
  goalCompareTextMissed: {
    ...typography.accent.body3,
    color: gray[500],
    letterSpacing: -0.28,
  },
  verifySummaryMissed: {
    backgroundColor: gray[50],
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  verifySummaryLabelMissed: {
    ...typography.primary.body3R,
    color: gray[500],
    letterSpacing: -0.24,
  },
  verifySummaryValueMissed: {
    ...typography.primary.body1B,
    color: gray[500],
    letterSpacing: -0.32,
  },
  recordButton: {
    height: 50,
    minWidth: 88,
    paddingHorizontal: 16,
    borderRadius: 18,
    backgroundColor: green[300],
    alignItems: 'center',
    justifyContent: 'center',
  },
  recordButtonLabel: {
    ...typography.primary.body1B,
    color: '#FFFFFF',
    textAlign: 'center',
    letterSpacing: -0.32,
  },
  actionGroup: {
    gap: 12,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 8,
  },
  skipButton: {
    height: 50,
    minWidth: 88,
    paddingHorizontal: 16,
    borderRadius: 18,
    backgroundColor: brown[900],
    alignItems: 'center',
    justifyContent: 'center',
    flexBasis: 0,
    flexGrow: 1,
  },
  skipButtonLabel: {
    ...typography.primary.body1B,
    color: '#FFFFFF',
    textAlign: 'center',
    letterSpacing: -0.32,
  },
  postButton: {
    height: 50,
    minWidth: 88,
    paddingHorizontal: 16,
    borderRadius: 18,
    backgroundColor: green[300],
    alignItems: 'center',
    justifyContent: 'center',
    flexBasis: 0,
    flexGrow: 1,
  },
  postButtonLabel: {
    ...typography.primary.body1B,
    color: '#FFFFFF',
    textAlign: 'center',
    letterSpacing: -0.32,
  },
  reportButton: {
    height: 32,
    minWidth: 80,
    paddingHorizontal: 12,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  reportButtonLabel: {
    ...typography.primary.body2B,
    color: gray[400],
    textAlign: 'center',
    letterSpacing: -0.28,
  },
});
