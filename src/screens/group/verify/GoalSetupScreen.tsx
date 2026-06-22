import { router, useLocalSearchParams } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  View,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { getUserUsageGoalTime, UserUsageGoalTimeRequestUsageGoalType } from '@/api';
import { logError, normalizeError } from '@/api/errors';
import { AppLogo, Button, HeaderAction, LoggingButton, LoggingPage } from '@/components';
import { trackEvent } from '@/lib/analytics';
import { formatHHMMToDisplay, formatMinutesAsHourMinute } from '@/lib/formatDuration';
import { primitiveColors, radius, spacing, typography } from '@/lib/token';

const { brown, gray } = primitiveColors;

const INITIAL_GOAL_MINUTES = 60;
const MIN_GOAL_MINUTES = 0;
const MAX_GOAL_MINUTES = 23 * 60 + 59;
const WHEEL_ITEM_HEIGHT = 28;
const WHEEL_VISIBLE_ITEMS = 5;
const WHEEL_HEIGHT = WHEEL_ITEM_HEIGHT * WHEEL_VISIBLE_ITEMS;
const HOUR_OPTIONS = Array.from({ length: 24 }, (_, index) => index);
const MINUTE_OPTIONS = Array.from({ length: 12 }, (_, index) => index * 5);

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
  const [minutes, setMinutes] = useState(INITIAL_GOAL_MINUTES);

  const screenTimeDisplay = !isEditMode ? formatHHMMToDisplay(value) : null;
  const isUnchanged = isEditMode && existingGoalMinutes != null && minutes === existingGoalMinutes;
  const selectedHour = Math.floor(minutes / 60);
  const rawMinute = minutes % 60;
  const selectedMinute = Math.min(55, Math.round(rawMinute / 5) * 5);

  const setClampedMinutes = useCallback((nextMinutes: number) => {
    setMinutes(Math.min(MAX_GOAL_MINUTES, Math.max(MIN_GOAL_MINUTES, nextMinutes)));
  }, []);

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
          const clampedGoalMinutes = Math.min(MAX_GOAL_MINUTES, Math.max(0, total.goalMinutes));
          setMinutes(clampedGoalMinutes);
          setExistingGoalMinutes(clampedGoalMinutes);
        }
      } catch (error) {
        if (!cancelled) {
          logError(normalizeError(error), {
            scope: 'goal.setup',
            operation: 'loadCurrentGoalTimes',
          });
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [isEditMode]);

  const handleHourChange = useCallback(
    (hour: number) => {
      setClampedMinutes(hour * 60 + selectedMinute);
    },
    [selectedMinute, setClampedMinutes]
  );

  const handleMinuteChange = useCallback(
    (minute: number) => {
      setClampedMinutes(selectedHour * 60 + minute);
    },
    [selectedHour, setClampedMinutes]
  );

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
      await SecureStore.deleteItemAsync('needsGoalReset');
      trackEvent('Goal Time Set', { mode });

      if (isEditMode) {
        router.back();
      } else {
        router.replace('/(feed)/home');
      }
    } catch (error) {
      logError(normalizeError(error), { scope: 'goal.setup', operation: 'saveGoalTimes' });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <LoggingPage eventName="Goal Setup Viewed" properties={{ pageName: 'GoalSetup', mode }}>
      <View style={styles.root}>
        <SafeAreaView edges={['top']}>
          <View style={isEditMode ? styles.editHeader : styles.initialHeader}>
            {isEditMode ? (
              <LoggingButton
                eventName="Goal Setup Back Clicked"
                properties={{ pageName: 'GoalSetup', buttonName: '뒤로가기', mode }}
              >
                <HeaderAction
                  label="목표 설정"
                  onPress={handleCancel}
                  accessibilityLabel="뒤로가기"
                />
              </LoggingButton>
            ) : (
              <AppLogo />
            )}
          </View>
        </SafeAreaView>

        <View style={styles.body}>
          <View style={styles.textGroup}>
            <Text style={styles.title}>개인 목표 스크린 타임 설정</Text>
            <Text style={styles.description}>2주에 한 번 변경할 수 있어요.</Text>
          </View>

          {isEditMode ? (
            <SummaryCard
              label="기존 목표"
              value={
                existingGoalMinutes != null ? formatMinutesAsHourMinute(existingGoalMinutes) : '-'
              }
            />
          ) : (
            <SummaryCard label="내 스크린 타임" value={screenTimeDisplay ?? '-'} />
          )}

          {isLoading ? (
            <View style={styles.loadingWrap}>
              <ActivityIndicator color={gray[400]} />
            </View>
          ) : (
            <GoalTimeWheelPicker
              hour={selectedHour}
              minute={selectedMinute}
              onHourChange={handleHourChange}
              onMinuteChange={handleMinuteChange}
            />
          )}
        </View>

        <SafeAreaView edges={['bottom']} style={styles.cta}>
          <Button
            label={isSaving ? '저장 중...' : '저장하기'}
            color="primary"
            onPress={handleSave}
            disabled={isLoading || isSaving || isUnchanged}
            style={styles.fullButton}
          />
        </SafeAreaView>
      </View>
    </LoggingPage>
  );
}

type SummaryCardProps = {
  label: string;
  value: string;
};

function SummaryCard({ label, value }: SummaryCardProps) {
  return (
    <View style={styles.summary}>
      <Text style={styles.summaryLabel}>{label}</Text>
      <Text style={styles.summaryValue}>{value}</Text>
    </View>
  );
}

type GoalTimeWheelPickerProps = {
  hour: number;
  minute: number;
  onHourChange: (hour: number) => void;
  onMinuteChange: (minute: number) => void;
};

function GoalTimeWheelPicker({
  hour,
  minute,
  onHourChange,
  onMinuteChange,
}: GoalTimeWheelPickerProps) {
  return (
    <View style={styles.pickerCard}>
      <Text style={styles.pickerTitle}>Time</Text>
      <View style={styles.pickerDivider} />
      <View style={styles.wheelWrap}>
        <View pointerEvents="none" style={styles.selectionPill} />
        <NumberWheel
          options={HOUR_OPTIONS}
          selectedValue={hour}
          unit="hour"
          onValueChange={onHourChange}
          columnWidth={70}
        />
        <NumberWheel
          options={MINUTE_OPTIONS}
          selectedValue={minute}
          unit="min"
          onValueChange={onMinuteChange}
        />
      </View>
    </View>
  );
}

type NumberWheelProps = {
  options: number[];
  selectedValue: number;
  unit: 'hour' | 'min';
  onValueChange: (value: number) => void;
  columnWidth?: number;
};

function NumberWheel({
  options,
  selectedValue,
  unit,
  onValueChange,
  columnWidth = 44,
}: NumberWheelProps) {
  const scrollRef = useRef<ScrollView>(null);
  const dragEndTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const momentumStartedRef = useRef(false);
  const userSelectedIndexRef = useRef<number | null>(null);
  const selectedIndex = useMemo(
    () =>
      Math.max(
        0,
        options.findIndex((option) => option === selectedValue)
      ),
    [options, selectedValue]
  );

  useEffect(() => {
    if (userSelectedIndexRef.current === selectedIndex) {
      userSelectedIndexRef.current = null;
      return;
    }

    requestAnimationFrame(() => {
      scrollRef.current?.scrollTo({
        y: selectedIndex * WHEEL_ITEM_HEIGHT,
        animated: false,
      });
    });
  }, [selectedIndex]);

  useEffect(
    () => () => {
      if (dragEndTimeoutRef.current) {
        clearTimeout(dragEndTimeoutRef.current);
      }
    },
    []
  );

  const settleScroll = useCallback(
    (offsetY: number) => {
      const rawIndex = Math.round(offsetY / WHEEL_ITEM_HEIGHT);
      const nextIndex = Math.min(options.length - 1, Math.max(0, rawIndex));
      const nextValue = options[nextIndex];
      userSelectedIndexRef.current = nextIndex;
      scrollRef.current?.scrollTo({
        y: nextIndex * WHEEL_ITEM_HEIGHT,
        animated: true,
      });
      if (nextValue !== selectedValue) {
        onValueChange(nextValue);
      }
    },
    [onValueChange, options, selectedValue]
  );

  const handleScrollEndDrag = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      const offsetY = event.nativeEvent.contentOffset.y;
      if (dragEndTimeoutRef.current) {
        clearTimeout(dragEndTimeoutRef.current);
      }

      dragEndTimeoutRef.current = setTimeout(() => {
        if (!momentumStartedRef.current) {
          settleScroll(offsetY);
        }
      }, 80);
    },
    [settleScroll]
  );

  const handleMomentumScrollBegin = useCallback(() => {
    momentumStartedRef.current = true;
    if (dragEndTimeoutRef.current) {
      clearTimeout(dragEndTimeoutRef.current);
      dragEndTimeoutRef.current = null;
    }
  }, []);

  const handleMomentumScrollEnd = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      momentumStartedRef.current = false;
      settleScroll(event.nativeEvent.contentOffset.y);
    },
    [settleScroll]
  );

  return (
    <View style={[styles.wheelGroup, { width: columnWidth + 54 }]}>
      <ScrollView
        ref={scrollRef}
        style={[styles.wheelColumn, { width: columnWidth }]}
        contentContainerStyle={styles.wheelContent}
        showsVerticalScrollIndicator={false}
        snapToInterval={WHEEL_ITEM_HEIGHT}
        decelerationRate="fast"
        bounces={false}
        onMomentumScrollBegin={handleMomentumScrollBegin}
        onMomentumScrollEnd={handleMomentumScrollEnd}
        onScrollEndDrag={handleScrollEndDrag}
        scrollEventThrottle={16}
      >
        {options.map((option) => {
          const selected = option === selectedValue;
          return (
            <View key={option} style={styles.wheelItem}>
              <Text style={[styles.wheelText, selected ? styles.selectedWheelNumber : null]}>
                {option}
              </Text>
            </View>
          );
        })}
      </ScrollView>
      <Text pointerEvents="none" style={[styles.selectedWheelUnit, { left: columnWidth + 8 }]}>
        {unit}
      </Text>
    </View>
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
    paddingTop: spacing[20],
  },
  textGroup: {},
  title: {
    ...typography.accent.h3,
    color: gray[900],
    letterSpacing: -0.52,
  },
  description: {
    marginTop: spacing[12],
    ...typography.primary.body2R,
    color: gray[400],
    letterSpacing: -0.28,
  },
  summary: {
    marginTop: spacing[40],
    backgroundColor: gray[50],
    borderRadius: radius[16],
    padding: spacing[16],
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
  pickerCard: {
    marginTop: spacing[20],
    height: 253,
    width: '100%',
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: spacing[16],
    paddingTop: spacing[12],
    overflow: 'hidden',
  },
  pickerTitle: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '400',
    color: '#000000',
    letterSpacing: 0,
  },
  pickerDivider: {
    marginTop: spacing[8],
    height: StyleSheet.hairlineWidth,
    backgroundColor: gray[100],
  },
  wheelWrap: {
    marginTop: spacing[16],
    height: WHEEL_HEIGHT,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  selectionPill: {
    position: 'absolute',
    left: -8,
    right: -8,
    top: WHEEL_HEIGHT / 2 - 16,
    height: 32,
    borderRadius: 16,
    backgroundColor: gray[50],
  },
  wheelGroup: {
    width: 82,
    height: WHEEL_HEIGHT,
  },
  wheelColumn: {
    width: 28,
    height: WHEEL_HEIGHT,
  },
  wheelContent: {
    paddingVertical: (WHEEL_HEIGHT - WHEEL_ITEM_HEIGHT) / 2,
  },
  wheelItem: {
    height: WHEEL_ITEM_HEIGHT,
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  wheelText: {
    fontSize: 20,
    lineHeight: WHEEL_ITEM_HEIGHT,
    fontWeight: '400',
    color: gray[300],
    textAlign: 'right',
  },
  selectedWheelNumber: {
    color: '#000000',
  },
  selectedWheelUnit: {
    position: 'absolute',
    top: WHEEL_HEIGHT / 2 - WHEEL_ITEM_HEIGHT / 2,
    left: 36,
    fontSize: 20,
    lineHeight: WHEEL_ITEM_HEIGHT,
    fontWeight: '700',
    color: '#000000',
    textAlign: 'left',
  },
  loadingWrap: {
    marginTop: spacing[20],
    height: 253,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cta: {
    paddingHorizontal: spacing[16],
    paddingTop: spacing[16],
    paddingBottom: 26,
    backgroundColor: brown[50],
  },
  fullButton: {
    alignSelf: 'stretch',
  },
});
