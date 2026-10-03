import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import * as ReactNativeDeviceActivity from 'react-native-device-activity';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '../../components/Button';
import { Icon } from '../../components/Icon';
import { primitiveColors, radius, spacing, typography } from '../../lib/token';
import { useLockStore } from '../../stores/lockStore';

const { gray, green, system } = primitiveColors;

const STEP_MINUTES = 5;
const MIN_MINUTES = 0;
const MAX_MINUTES = 30;
const STARTED_TOAST_DELAY_MS = 1800;

const formatTimeLabel = (date: Date) => {
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
};

const toDateComponents = (date: Date) => ({
  hour: date.getHours(),
  minute: date.getMinutes(),
  second: date.getSeconds(),
});

/**
 * 지금부터 minutes분 동안, 이 앱만 화이트리스트에 넣어 실제로 해제한다.
 * DeviceActivityMonitor 스케줄이 끝나면(intervalDidEnd) 화이트리스트에서 다시
 * 빼도록 액션을 등록해둬서, 앱이 백그라운드/종료 상태여도 OS가 알아서 재잠금한다.
 */
const unlockAppForMinutes = (token: string, minutes: number) => {
  ReactNativeDeviceActivity.addSelectionToWhitelistAndUpdateBlock(
    { activitySelectionToken: token },
    'temp-unlock'
  );

  const activityName = `temp-unlock-${Date.now()}`;
  const start = new Date();
  const end = new Date(start.getTime() + minutes * 60000);

  ReactNativeDeviceActivity.configureActions({
    activityName,
    callbackName: 'intervalDidEnd',
    actions: [
      {
        type: 'removeSelectionFromWhitelist',
        familyActivitySelection: { activitySelectionToken: token },
      },
    ],
  });

  ReactNativeDeviceActivity.startMonitoring(
    activityName,
    {
      intervalStart: toDateComponents(start),
      intervalEnd: toDateComponents(end),
      repeats: false,
    },
    []
  );
};

/**
 * 10초 재고 시간이 끝난 뒤, 해당 앱을 몇 분 더 사용할지 정하는 화면.
 */
export default function UnlockDurationScreen() {
  const router = useRouter();
  const { lockedApps, targetMinutes, extendUsage, familyActivitySelectionsByAppId } =
    useLockStore();
  const app = lockedApps[0];
  const [stepperMinutes, setStepperMinutes] = useState(0);
  const [showStartedToast, setShowStartedToast] = useState(false);

  const baseUsedMinutes = app?.usedMinutes ?? 0;
  const previewUsedMinutes = baseUsedMinutes + stepperMinutes;
  const isOverLimit = previewUsedMinutes > targetMinutes;
  const progressRatio = targetMinutes > 0 ? Math.min(previewUsedMinutes / targetMinutes, 1) : 0;
  const relockTimeLabel = formatTimeLabel(new Date(Date.now() + stepperMinutes * 60000));

  const handleDecrement = () => {
    setStepperMinutes((prev) => Math.max(prev - STEP_MINUTES, MIN_MINUTES));
  };

  const handleIncrement = () => {
    setStepperMinutes((prev) => Math.min(prev + STEP_MINUTES, MAX_MINUTES));
  };

  const handleConfirm = () => {
    if (app) {
      extendUsage(app.id, stepperMinutes);

      const token = familyActivitySelectionsByAppId[app.id];
      if (token && stepperMinutes > 0) {
        unlockAppForMinutes(token, stepperMinutes);
      }
    }

    setShowStartedToast(true);
    setTimeout(() => {
      router.dismissAll();
      router.replace('/(lock)/restricted-apps');
    }, STARTED_TOAST_DELAY_MS);
  };

  return (
    <View style={styles.root}>
      <SafeAreaView edges={['top']} style={styles.safeArea}>
        {showStartedToast && (
          <>
            <View style={styles.dimOverlay} />
            <View style={styles.toast}>
              <Text style={styles.toastText}>타이머가 시작됐어요.</Text>
              <Text style={styles.toastText}>앱 사용을 위해 돌아가세요.</Text>
            </View>
          </>
        )}

        <View style={styles.content}>
          <Text style={styles.title}>
            {app?.name ?? '이 앱'}, {relockTimeLabel}에 다시 잠겨요.
          </Text>

          <View
            style={[styles.progressTrack, isOverLimit && styles.progressTrackOverLimit]}
          >
            <View
              style={[
                styles.progressFill,
                {
                  width: `${progressRatio * 100}%`,
                  backgroundColor: isOverLimit ? system.red.opacity100 : green[300],
                },
              ]}
            />
          </View>
          <View style={styles.progressLabels}>
            <Text style={styles.usedLabel}>
              사용 시간{' '}
              <Text style={[styles.usedValue, isOverLimit && styles.usedValueOverLimit]}>
                {previewUsedMinutes}분
              </Text>
            </Text>
            <Text style={styles.limitLabel}>
              제한 시간{' '}
              <Text style={isOverLimit ? styles.limitValueOverLimit : styles.limitValue}>
                {targetMinutes}분
              </Text>
            </Text>
          </View>
        </View>

        <View style={styles.stepperRow}>
          <Pressable
            style={[
              styles.stepperButton,
              stepperMinutes <= MIN_MINUTES && styles.stepperButtonDisabled,
            ]}
            disabled={stepperMinutes <= MIN_MINUTES}
            onPress={handleDecrement}
          >
            <Icon name="minus" size={20} color="#FFFFFF" />
          </Pressable>
          <Text style={styles.stepperValue}>{stepperMinutes} 분</Text>
          <Pressable
            style={[
              styles.stepperButton,
              stepperMinutes >= MAX_MINUTES && styles.stepperButtonDisabled,
            ]}
            disabled={stepperMinutes >= MAX_MINUTES}
            onPress={handleIncrement}
          >
            <Icon name="plus" size={20} color="#FFFFFF" />
          </Pressable>
        </View>

        <Button
          label="완료"
          variant="solid"
          color="primary"
          size="lg"
          onPress={handleConfirm}
          style={styles.confirmButton}
        />
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: gray[50],
  },
  safeArea: {
    flex: 1,
    paddingHorizontal: spacing[16],
    paddingBottom: spacing[16],
  },
  dimOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(43, 47, 56, 0.35)',
    zIndex: 1,
  },
  toast: {
    position: 'absolute',
    top: spacing[16],
    left: spacing[16],
    right: spacing[16],
    backgroundColor: 'rgba(43, 47, 56, 0.92)',
    borderRadius: radius[16],
    paddingVertical: spacing[12],
    paddingHorizontal: spacing[16],
    alignItems: 'center',
    zIndex: 2,
  },
  toastText: {
    ...typography.primary.body2B,
    color: '#FFFFFF',
    textAlign: 'center',
  },
  content: {
    paddingTop: spacing[32],
    gap: spacing[12],
  },
  title: {
    ...typography.primary.title1B,
    color: gray[900],
    textAlign: 'center',
  },
  progressTrack: {
    height: 8,
    borderRadius: radius.full,
    backgroundColor: 'rgba(90, 137, 116, 0.3)',
    overflow: 'hidden',
    marginTop: spacing[8],
  },
  progressTrackOverLimit: {
    backgroundColor: system.red.opacity10,
  },
  progressFill: {
    height: '100%',
    borderRadius: radius.full,
  },
  progressLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  usedLabel: {
    ...typography.primary.body3B,
    color: gray[900],
  },
  usedValue: {
    ...typography.primary.body3B,
    color: green[300],
  },
  usedValueOverLimit: {
    color: system.red.opacity100,
  },
  limitLabel: {
    ...typography.primary.body3R,
    color: gray[600],
  },
  limitValue: {
    ...typography.primary.body3R,
    color: green[300],
  },
  limitValueOverLimit: {
    ...typography.primary.body3R,
    color: system.red.opacity100,
  },
  stepperRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing[32],
  },
  stepperButton: {
    width: 48,
    height: 48,
    borderRadius: radius.full,
    backgroundColor: green[300],
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperButtonDisabled: {
    backgroundColor: gray[100],
  },
  stepperValue: {
    ...typography.accent.h2,
    color: gray[900],
    minWidth: 100,
    textAlign: 'center',
  },
  confirmButton: {
    width: '100%',
  },
});
