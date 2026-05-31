import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
  type GestureResponderEvent,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { getUserUsageGoalTime, UserUsageGoalTimeRequestUsageGoalType } from '@/api';
import { AppLogo, Button, HeaderAction, Icon } from '@/components';
import { formatHHMMToDisplay, formatMinutesAsHourMinute } from '@/lib/formatDuration';
import { primitiveColors, radius, spacing, typography } from '@/lib/token';
import { useGoalTimeStepper } from './useGoalTimeStepper';

const { brown, gray, green } = primitiveColors;

const EDIT_MIN_MINUTES = 30;
const EDIT_MAX_MINUTES = 24 * 60 - 10;

type GoalSetupMode = 'initial' | 'edit';

type GoalSetupScreenProps = {
  mode?: GoalSetupMode;
};

export default function GoalSetupScreen({ mode = 'initial' }: GoalSetupScreenProps) {
  const { value } = useLocalSearchParams<{ value?: string }>();
  const isEditMode = mode === 'edit';
  const [existingGoalMinutes, setExistingGoalMinutes] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(isEditMode);
  const [isSaving, setIsSaving] = useState(false);
  const { canDecrease, canIncrease, clearHold, minutes, setMinutes, startDecrease, startIncrease } =
    useGoalTimeStepper(
      isEditMode ? { minMinutes: EDIT_MIN_MINUTES, maxMinutes: EDIT_MAX_MINUTES } : undefined
    );

  const screenTimeDisplay = !isEditMode ? formatHHMMToDisplay(value) : null;
  const isUnchanged = isEditMode && existingGoalMinutes != null && minutes === existingGoalMinutes;

  useEffect(() => {
    if (!isEditMode) return;

    let cancelled = false;
    (async () => {
      try {
        const response = await getUserUsageGoalTime().getCurrentGoalTimes();
        if (cancelled) return;

        const total = response.goals?.find(
          (goal) => goal.usageGoalType === UserUsageGoalTimeRequestUsageGoalType.TOTAL_USAGE
        );
        if (total?.goalMinutes != null) {
          setMinutes(total.goalMinutes);
          setExistingGoalMinutes(total.goalMinutes);
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [isEditMode, setMinutes]);

  const handleCancel = () => {
    router.back();
  };

  const handleSave = async () => {
    if (isLoading || isSaving || isUnchanged) return;

    setIsSaving(true);
    try {
      await getUserUsageGoalTime().setGoalTimes({
        goals: [
          {
            usageGoalType: UserUsageGoalTimeRequestUsageGoalType.TOTAL_USAGE,
            goalMinutes: minutes,
          },
        ],
      });

      if (isEditMode) {
        router.back();
      } else {
        router.replace('/(feed)/home');
      }
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <View style={styles.root}>
      <SafeAreaView edges={['top']}>
        <View style={isEditMode ? styles.editHeader : styles.initialHeader}>
          {isEditMode ? (
            <HeaderAction label="목표 설정" onPress={handleCancel} accessibilityLabel="뒤로가기" />
          ) : (
            <AppLogo />
          )}
        </View>
      </SafeAreaView>

      <View style={[styles.body, isEditMode ? styles.editBody : styles.initialBody]}>
        <View style={[styles.textGroup, isEditMode ? styles.editTextGroup : null]}>
          <Text style={styles.title}>개인 목표 스크린 타임 설정</Text>
          <Text style={styles.description}>
            {isEditMode
              ? '2주에 한 번 변경할 수 있어요.'
              : '마이페이지에서 2주에 한 번 변경할 수 있어요.'}
          </Text>
        </View>

        {isEditMode ? (
          <SummaryCard
            label="기존 목표"
            mode={mode}
            value={
              existingGoalMinutes != null ? formatMinutesAsHourMinute(existingGoalMinutes) : '-'
            }
          />
        ) : screenTimeDisplay ? (
          <SummaryCard label="내 스크린 타임" mode={mode} value={screenTimeDisplay} />
        ) : null}

        {isLoading ? (
          <View style={styles.loadingWrap}>
            <ActivityIndicator color={gray[400]} />
          </View>
        ) : (
          <View style={isEditMode ? styles.editStepperWrap : styles.initialStepperWrap}>
            <View style={styles.stepper}>
              <StepButton
                kind="minus"
                mode={mode}
                onPressIn={startDecrease}
                onPressOut={clearHold}
                disabled={!canDecrease}
              />
              <Text style={styles.stepperValue}>{formatMinutesAsHourMinute(minutes)}</Text>
              <StepButton
                kind="plus"
                mode={mode}
                onPressIn={startIncrease}
                onPressOut={clearHold}
                disabled={!canIncrease}
              />
            </View>
            <Text style={styles.stepperCaption}>하루 기준</Text>
          </View>
        )}
      </View>

      <SafeAreaView edges={['bottom']} style={isEditMode ? styles.editCta : styles.initialCta}>
        {isEditMode ? (
          <>
            <Button
              label="취소"
              color="assistive"
              onPress={handleCancel}
              style={styles.cancelButton}
            />
            <Button
              label={isSaving ? '저장 중...' : '저장하기'}
              color="primary"
              disabled={isLoading || isSaving || isUnchanged}
              onPress={handleSave}
              style={styles.saveButton}
            />
          </>
        ) : (
          <Button
            label={isSaving ? '저장 중...' : '저장하기'}
            color="primary"
            onPress={handleSave}
            disabled={isSaving}
            style={styles.fullButton}
          />
        )}
      </SafeAreaView>
    </View>
  );
}

type SummaryCardProps = {
  label: string;
  mode: GoalSetupMode;
  value: string;
};

function SummaryCard({ label, mode, value }: SummaryCardProps) {
  return (
    <View style={[styles.summary, mode === 'edit' ? styles.editSummary : null]}>
      <Text style={styles.summaryLabel}>{label}</Text>
      <Text style={styles.summaryValue}>{value}</Text>
    </View>
  );
}

type StepButtonProps = {
  kind: 'plus' | 'minus';
  mode: GoalSetupMode;
  onPressIn: (e: GestureResponderEvent) => void;
  onPressOut: (e: GestureResponderEvent) => void;
  disabled?: boolean;
};

function StepButton({ kind, mode, onPressIn, onPressOut, disabled }: StepButtonProps) {
  const isEditMode = mode === 'edit';
  const iconName = isEditMode ? (kind === 'plus' ? 'plusCircle' : 'minusCircle') : kind;

  return (
    <Pressable
      onPressIn={disabled ? undefined : onPressIn}
      onPressOut={disabled ? undefined : onPressOut}
      disabled={disabled}
      hitSlop={isEditMode ? 8 : undefined}
      style={({ pressed }) => [
        isEditMode ? styles.editStepButton : styles.initialStepButton,
        pressed && !disabled && !isEditMode ? styles.initialStepButtonPressed : null,
        disabled ? styles.stepButtonDisabled : null,
      ]}
      accessibilityRole="button"
    >
      <Icon
        name={iconName}
        size={isEditMode ? 57 : 28}
        weight={isEditMode ? 'fill' : undefined}
        color={isEditMode ? gray[900] : '#FFFFFF'}
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: brown[50],
  },
  initialHeader: {
    height: 54,
    paddingHorizontal: spacing[16],
    justifyContent: 'center',
  },
  editHeader: {
    height: 54,
    paddingHorizontal: spacing[16],
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[16],
  },
  body: {
    flex: 1,
    paddingHorizontal: spacing[16],
  },
  initialBody: {
    paddingTop: spacing[12],
    gap: spacing[32],
  },
  editBody: {
    paddingTop: spacing[20],
  },
  textGroup: {
    gap: spacing[4],
  },
  editTextGroup: {
    gap: spacing[12],
  },
  title: {
    ...typography.accent.h3,
    color: gray[900],
  },
  description: {
    ...typography.primary.body2R,
    color: gray[400],
  },
  summary: {
    backgroundColor: gray[50],
    borderRadius: radius[16],
    padding: spacing[16],
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  editSummary: {
    marginTop: spacing[28],
  },
  summaryLabel: {
    ...typography.primary.body3R,
    color: gray[500],
  },
  summaryValue: {
    ...typography.primary.body1B,
    color: gray[500],
  },
  initialStepperWrap: {
    marginTop: spacing[28],
    alignItems: 'center',
    gap: spacing[16],
  },
  editStepperWrap: {
    marginTop: spacing[80],
    alignItems: 'center',
    gap: spacing[16],
  },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
  },
  stepperValue: {
    ...typography.accent.h1,
    fontSize: 57,
    lineHeight: 57 * 1.3,
    color: '#000000',
  },
  stepperCaption: {
    ...typography.primary.title1B,
    color: '#000000',
  },
  initialStepButton: {
    width: 57,
    height: 57,
    borderRadius: 28.5,
    backgroundColor: green[300],
    alignItems: 'center',
    justifyContent: 'center',
  },
  editStepButton: {
    width: 57,
    height: 57,
    alignItems: 'center',
    justifyContent: 'center',
  },
  initialStepButtonPressed: {
    opacity: 0.85,
  },
  stepButtonDisabled: {
    opacity: 0.4,
  },
  loadingWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  initialCta: {
    paddingHorizontal: spacing[16],
    paddingTop: spacing[16],
    paddingBottom: spacing[44],
  },
  editCta: {
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
  fullButton: {
    alignSelf: 'stretch',
  },
});
