import { useLocalSearchParams } from 'expo-router';
import {
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
  type GestureResponderEvent,
} from 'react-native';

import { AppLogo, Button, Icon } from '@/components';
import { formatHHMMToDisplay, formatMinutesAsHourMinute } from '@/lib/formatDuration';
import { primitiveColors, typography } from '@/lib/token';
import { useGoalTimeSave } from './useGoalTimeSave';
import { useGoalTimeStepper } from './useGoalTimeStepper';

const { gray, brown, green } = primitiveColors;

export default function GoalSetupScreen() {
  const { value } = useLocalSearchParams<{ value?: string }>();
  const { canDecrease, canIncrease, clearHold, minutes, startDecrease, startIncrease } =
    useGoalTimeStepper();
  const { handleSave, isSaving } = useGoalTimeSave(minutes);

  const screenTimeDisplay = formatHHMMToDisplay(value);

  return (
    <SafeAreaView style={styles.root}>
      <View style={styles.header}>
        <AppLogo />
      </View>

      <View style={styles.body}>
        <View style={styles.textGroup}>
          <Text style={styles.title}>개인 목표 스크린 타임 설정</Text>
          <Text style={styles.description}>마이페이지에서 2주에 한 번 변경할 수 있어요.</Text>
        </View>

        {screenTimeDisplay ? (
          <View style={styles.summary}>
            <Text style={styles.summaryLabel}>내 스크린 타임</Text>
            <Text style={styles.summaryValue}>{screenTimeDisplay}</Text>
          </View>
        ) : null}

        <View style={styles.stepperWrap}>
          <View style={styles.stepper}>
            <StepButton
              kind="minus"
              onPressIn={startDecrease}
              onPressOut={clearHold}
              disabled={!canDecrease}
            />
            <Text style={styles.stepperValue}>{formatMinutesAsHourMinute(minutes)}</Text>
            <StepButton
              kind="plus"
              onPressIn={startIncrease}
              onPressOut={clearHold}
              disabled={!canIncrease}
            />
          </View>
          <Text style={styles.stepperCaption}>하루 기준</Text>
        </View>
      </View>

      <View style={styles.cta}>
        <Button
          label={isSaving ? '저장 중...' : '저장하기'}
          color="primary"
          onPress={handleSave}
          disabled={isSaving}
          style={styles.button}
        />
      </View>
    </SafeAreaView>
  );
}

type StepButtonProps = {
  kind: 'plus' | 'minus';
  onPressIn: (e: GestureResponderEvent) => void;
  onPressOut: (e: GestureResponderEvent) => void;
  disabled?: boolean;
};

function StepButton({ kind, onPressIn, onPressOut, disabled }: StepButtonProps) {
  return (
    <Pressable
      onPressIn={disabled ? undefined : onPressIn}
      onPressOut={disabled ? undefined : onPressOut}
      disabled={disabled}
      style={({ pressed }) => [
        styles.stepBtn,
        pressed && !disabled ? styles.stepBtnPressed : null,
        disabled ? styles.stepBtnDisabled : null,
      ]}
      accessibilityRole="button"
    >
      <Icon name={kind} size={28} color="#FFFFFF" />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: brown[50],
  },
  header: {
    height: 54,
    paddingHorizontal: 16,
    justifyContent: 'center',
  },
  body: {
    flex: 1,
    paddingHorizontal: 16,
    gap: 32,
  },
  textGroup: {
    gap: 4,
    marginTop: 12,
  },
  title: {
    ...typography.accent.h3,
    color: gray[900],
    letterSpacing: -0.52,
  },
  description: {
    ...typography.primary.body2R,
    color: gray[400],
    letterSpacing: -0.28,
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
  stepperWrap: {
    marginTop: 60,
    alignItems: 'center',
    gap: 16,
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
    color: '#000',
    letterSpacing: -1.15,
  },
  stepperCaption: {
    ...typography.primary.title1B,
    color: '#000',
    letterSpacing: -0.4,
  },
  stepBtn: {
    width: 57,
    height: 57,
    borderRadius: 28.5,
    backgroundColor: green[300],
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepBtnPressed: {
    opacity: 0.85,
  },
  stepBtnDisabled: {
    opacity: 0.4,
  },
  cta: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 60,
  },
  button: {
    alignSelf: 'stretch',
  },
});
