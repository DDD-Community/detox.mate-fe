import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Image,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
  type GestureResponderEvent,
} from 'react-native';
import { Button } from '../../../components/Button';
import { primitiveColors } from '../../../lib/token/primitive/colors';
import { typography } from '../../../lib/token/primitive/typography';

const { gray, brown, green } = primitiveColors;

const STEP_MINUTES = 10;
const MIN_MINUTES = 0;
const MAX_MINUTES = 24 * 60;
const INITIAL_MINUTES = 2 * 60;
const HOLD_DELAY_MS = 400;
const HOLD_INTERVAL_MS = 80;

function formatHHMMToDisplay(value: string | undefined): string {
  if (!value) return '';
  const [hStr, mStr] = value.split(':');
  return `${Number(hStr ?? 0)}h ${Number(mStr ?? 0)}m`;
}

function formatMinutes(totalMinutes: number): string {
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  return `${h}h ${m.toString().padStart(2, '0')}m`;
}

export default function GoalSetupScreen() {
  const { value } = useLocalSearchParams<{ value?: string }>();
  const [minutes, setMinutes] = useState(INITIAL_MINUTES);

  const minutesRef = useRef(minutes);
  useEffect(() => {
    minutesRef.current = minutes;
  }, [minutes]);

  const holdTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const holdIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const clearHold = useCallback(() => {
    if (holdTimeoutRef.current) {
      clearTimeout(holdTimeoutRef.current);
      holdTimeoutRef.current = null;
    }
    if (holdIntervalRef.current) {
      clearInterval(holdIntervalRef.current);
      holdIntervalRef.current = null;
    }
  }, []);

  useEffect(() => clearHold, [clearHold]);

  const apply = useCallback((delta: number) => {
    setMinutes((prev) => {
      const next = prev + delta;
      if (next < MIN_MINUTES) return MIN_MINUTES;
      if (next > MAX_MINUTES) return MAX_MINUTES;
      return next;
    });
  }, []);

  const startHold = useCallback(
    (delta: number) => {
      clearHold();
      apply(delta);
      holdTimeoutRef.current = setTimeout(() => {
        holdIntervalRef.current = setInterval(() => apply(delta), HOLD_INTERVAL_MS);
      }, HOLD_DELAY_MS);
    },
    [apply, clearHold]
  );

  const handleSave = () => {
    // TODO: API 연결 — 개인 목표 시간 저장
    router.replace('/(group)/feed');
  };

  const screenTimeDisplay = formatHHMMToDisplay(value);

  return (
    <SafeAreaView style={styles.root}>
      <View style={styles.header}>
        <Image
          source={require('../../../../assets/logo-detoxmate-black.png')}
          style={styles.logo}
          resizeMode="contain"
        />
      </View>

      <View style={styles.body}>
        <View style={styles.textGroup}>
          <Text style={styles.title}>개인 목표 스크린타임 설정</Text>
          <Text style={styles.description}>마이페이지에서 2주에 한 번 변경할 수 있어요.</Text>
        </View>

        {screenTimeDisplay ? (
          <View style={styles.summary}>
            <Text style={styles.summaryLabel}>내 스크린타임</Text>
            <Text style={styles.summaryValue}>{screenTimeDisplay}</Text>
          </View>
        ) : null}

        <View style={styles.stepperWrap}>
          <View style={styles.stepper}>
            <StepButton
              kind="minus"
              onPressIn={() => startHold(-STEP_MINUTES)}
              onPressOut={clearHold}
              disabled={minutes <= MIN_MINUTES}
            />
            <Text style={styles.stepperValue}>{formatMinutes(minutes)}</Text>
            <StepButton
              kind="plus"
              onPressIn={() => startHold(STEP_MINUTES)}
              onPressOut={clearHold}
              disabled={minutes >= MAX_MINUTES}
            />
          </View>
          <Text style={styles.stepperCaption}>하루 기준</Text>
        </View>
      </View>

      <View style={styles.cta}>
        <Button label="저장하기" color="primary" onPress={handleSave} style={styles.button} />
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
  const source =
    kind === 'plus'
      ? require('../../../../assets/icons/regular/icon_rg_Plus.png')
      : require('../../../../assets/icons/regular/icon_rg_Minus.png');

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
      <Image source={source} style={styles.stepIcon} resizeMode="contain" />
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
  logo: {
    width: 110,
    height: 18,
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
  stepIcon: {
    width: 28,
    height: 28,
    tintColor: '#FFFFFF',
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
