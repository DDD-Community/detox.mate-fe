import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { getUserUsageGoalTime } from '../../../api/generated/user-usage-goal-time/user-usage-goal-time';
import { UserUsageGoalTimeRequestUsageGoalType } from '../../../api/generated/model';
import { Button } from '../../../components/Button';
import { Icon } from '../../../components/Icon';
import { formatMinutesAsHourMinute } from '../../../lib/formatDuration';
import { primitiveColors, radius, spacing, typography } from '../../../lib/token';

const { brown, gray, green } = primitiveColors;

const STEP_MINUTES = 10;
const MIN_MINUTES = 30;
const MAX_MINUTES = 24 * 60 - STEP_MINUTES;

export default function EditGoalTimeScreen() {
  const [goalMinutes, setGoalMinutes] = useState(120);
  const [existingGoalMinutes, setExistingGoalMinutes] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const response = await getUserUsageGoalTime().getCurrentGoalTimes();
        if (cancelled) return;
        const total = response.goals?.find(
          (g) => g.usageGoalType === UserUsageGoalTimeRequestUsageGoalType.TOTAL_USAGE
        );
        if (total?.goalMinutes != null) {
          setGoalMinutes(total.goalMinutes);
          setExistingGoalMinutes(total.goalMinutes);
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const canDecrease = goalMinutes - STEP_MINUTES >= MIN_MINUTES;
  const canIncrease = goalMinutes + STEP_MINUTES <= MAX_MINUTES;
  const isUnchanged = existingGoalMinutes != null && goalMinutes === existingGoalMinutes;

  const handleDecrease = () => {
    if (!canDecrease) return;
    setGoalMinutes((prev) => prev - STEP_MINUTES);
  };

  const handleIncrease = () => {
    if (!canIncrease) return;
    setGoalMinutes((prev) => prev + STEP_MINUTES);
  };

  const handleCancel = () => {
    router.back();
  };

  const handleSave = async () => {
    if (isSaving || isUnchanged) return;
    setIsSaving(true);
    try {
      await getUserUsageGoalTime().setGoalTimes({
        goals: [
          {
            usageGoalType: UserUsageGoalTimeRequestUsageGoalType.TOTAL_USAGE,
            goalMinutes,
          },
        ],
      });
      router.back();
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <View style={styles.root}>
      <SafeAreaView edges={['top']}>
        <View style={styles.header}>
          <Pressable onPress={handleCancel} hitSlop={8}>
            <Icon name="caretLeft" size={24} color={gray[800]} />
          </Pressable>
          <Text style={styles.headerTitle}>목표 설정</Text>
        </View>
      </SafeAreaView>

      <View style={styles.body}>
        <Text style={styles.title}>개인 목표 스크린 타임 설정</Text>
        <Text style={styles.subtitle}>2주에 한 번 변경할 수 있어요.</Text>

        <View style={styles.myCard}>
          <Text style={styles.myCardLabel}>기존 목표</Text>
          <Text style={styles.myCardValue}>
            {existingGoalMinutes != null ? formatMinutesAsHourMinute(existingGoalMinutes) : '-'}
          </Text>
        </View>

        {isLoading ? (
          <View style={styles.loadingWrap}>
            <ActivityIndicator color={gray[400]} />
          </View>
        ) : (
          <View style={styles.pickerWrap}>
            <View style={styles.pickerRow}>
              <Pressable
                onPress={handleDecrease}
                disabled={!canDecrease}
                hitSlop={8}
                style={!canDecrease && styles.disabledIcon}
              >
                <Icon name="minusCircle" size={57} weight="fill" color={gray[900]} />
              </Pressable>
              <Text style={styles.timeValue}>{formatMinutesAsHourMinute(goalMinutes)}</Text>
              <Pressable
                onPress={handleIncrease}
                disabled={!canIncrease}
                hitSlop={8}
                style={!canIncrease && styles.disabledIcon}
              >
                <Icon name="plusCircle" size={57} weight="fill" color={gray[900]} />
              </Pressable>
            </View>
            <Text style={styles.unitLabel}>하루 기준</Text>
          </View>
        )}
      </View>

      <SafeAreaView edges={['bottom']} style={styles.ctaWrap}>
        <Button label="취소" color="assistive" onPress={handleCancel} style={styles.cancelButton} />
        <Button
          label="저장하기"
          color="primary"
          disabled={isLoading || isSaving || isUnchanged}
          onPress={handleSave}
          style={styles.saveButton}
        />
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: brown[50],
  },
  header: {
    height: 54,
    paddingHorizontal: spacing[16],
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[16],
  },
  headerTitle: {
    ...typography.accent.title2,
    color: gray[800],
  },
  body: {
    flex: 1,
    paddingHorizontal: spacing[16],
    paddingTop: spacing[20],
  },
  title: {
    ...typography.accent.h3,
    color: gray[900],
  },
  subtitle: {
    ...typography.primary.body2R,
    color: gray[400],
    marginTop: spacing[12],
  },
  myCard: {
    marginTop: spacing[28],
    backgroundColor: gray[50],
    borderRadius: radius[16],
    padding: spacing[16],
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  myCardLabel: {
    ...typography.primary.body3R,
    color: gray[500],
  },
  myCardValue: {
    ...typography.primary.body1B,
    color: gray[500],
  },
  pickerWrap: {
    marginTop: spacing[80],
    alignItems: 'center',
    gap: spacing[16],
  },
  pickerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
  },
  disabledIcon: {
    opacity: 0.3,
  },
  timeValue: {
    fontFamily: typography.accent.h2.fontFamily,
    fontSize: 57,
    lineHeight: 57 * 1.3,
    color: '#000000',
    letterSpacing: -1.15,
  },
  unitLabel: {
    ...typography.primary.title1B,
    color: '#000000',
  },
  ctaWrap: {
    flexDirection: 'row',
    gap: spacing[8],
    paddingHorizontal: spacing[16],
    paddingTop: spacing[16],
  },
  cancelButton: {
    width: 108,
  },
  saveButton: {
    flex: 1,
  },
  loadingWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
