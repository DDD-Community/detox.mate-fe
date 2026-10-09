import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import * as ReactNativeDeviceActivity from 'react-native-device-activity';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ScreenTimeReportView } from '../../../modules/screen-time-report';
import { Button } from '../../components/Button';
import { Icon } from '../../components/Icon';
import { fontFamily, primitiveColors, radius, spacing, typography } from '../../lib/token';
import { scheduleRelockWarning } from '../../lib/relockWarning';
import { syncUsageBarExtraMinutes } from '../../lib/sharedDisplayConfig';
import { useLockStore } from '../../stores/lockStore';

const { gray, green } = primitiveColors;

const STEP_MINUTES = 5;
const MIN_MINUTES = 0;
const MAX_MINUTES = 30;
// Apple의 DeviceActivitySchedule 최소 길이.
const MIN_SCHEDULE_MINUTES = 15;
const RELOCK_EVENT_NAME = 'relock';

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
  const now = new Date();
  const relockAt = new Date(now.getTime() + minutes * 60000);

  const removeFromWhitelist = {
    type: 'removeSelectionFromWhitelist' as const,
    familyActivitySelection: { activitySelectionToken: token },
  };

  ReactNativeDeviceActivity.configureActions({
    activityName,
    callbackName: 'intervalDidEnd',
    actions: [removeFromWhitelist],
  });

  const relockImmediately = (reason: unknown) => {
    // 예약이 끝까지 실패하면 앱이 영영 안 잠기므로, 조용히 삼키지 말고 즉시 다시 잠근다.
    console.warn('[unlock] 재잠금 예약 실패 — 즉시 다시 잠급니다', reason);
    ReactNativeDeviceActivity.removeSelectionFromWhitelistAndUpdateBlock(
      { activitySelectionToken: token },
      'temp-unlock-schedule-failed'
    );
  };

  // DeviceActivity 스케줄은 "길이"가 최소 15분이어야 한다(Apple 제약). 15분 미만 해제는
  // 스케줄 끝(intervalEnd)을 재잠금 시각에 맞추고, 시작(intervalStart)을 15분 앞으로 당겨
  // 길이만 15분으로 맞춘다 — 이미 시작된 구간이라 지금 바로 모니터링되고 끝에서 intervalDidEnd가
  // 불린다. 자정을 넘기는 경우는 DateComponents(시:분:초)로 표현이 안 돼서 아래 폴백으로 간다.
  const windowStart = new Date(relockAt.getTime() - MIN_SCHEDULE_MINUTES * 60000);
  const crossesMidnight =
    windowStart.getDate() !== relockAt.getDate() || relockAt.getDate() !== now.getDate();

  const startShifted = () =>
    ReactNativeDeviceActivity.startMonitoring(
      activityName,
      {
        intervalStart: toDateComponents(minutes < MIN_SCHEDULE_MINUTES ? windowStart : now),
        intervalEnd: toDateComponents(relockAt),
        repeats: false,
      },
      []
    );

  // 폴백: 스케줄은 15분 이상(당일 끝까지)으로 잡고, 15분 미만이면 "N분 사용" 임계값 이벤트로
  // 먼저 재잠금한다(= 이 경우는 시계 시간이 아니라 실제 사용 시간 기준).
  const startFallback = () => {
    const end = new Date(
      Math.min(
        now.getTime() + Math.max(minutes, MIN_SCHEDULE_MINUTES) * 60000,
        new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59).getTime()
      )
    );
    const events: ReactNativeDeviceActivity.DeviceActivityEvent[] = [];
    if (minutes < MIN_SCHEDULE_MINUTES) {
      ReactNativeDeviceActivity.configureActions({
        activityName,
        callbackName: 'eventDidReachThreshold',
        eventName: RELOCK_EVENT_NAME,
        actions: [removeFromWhitelist],
      });
      events.push({
        eventName: RELOCK_EVENT_NAME,
        familyActivitySelection: token,
        threshold: { minute: minutes },
      });
    }
    return ReactNativeDeviceActivity.startMonitoring(
      activityName,
      { intervalStart: toDateComponents(now), intervalEnd: toDateComponents(end), repeats: false },
      events
    );
  };

  (crossesMidnight ? startFallback() : startShifted().catch(startFallback)).catch(
    relockImmediately
  );
};

/**
 * 10초 재고 시간이 끝난 뒤, 해당 앱을 몇 분 더 사용할지 정하는 화면.
 */
export default function UnlockDurationScreen() {
  const router = useRouter();
  // 쉴드 알림에서 넘어온, 지금 해제하려는 등록 앱의 id.
  const { appId } = useLocalSearchParams<{ appId?: string }>();
  const { lockedApps, extendUsage, familyActivitySelectionsByAppId } = useLockStore();
  // appId를 모르는 경로(프로토타입 쉴드 등)는 등록 앱이 하나뿐일 때만 그 앱으로 본다 —
  // 여러 개인데 첫 번째로 가정하면 엉뚱한 앱이 풀린다.
  const app = appId
    ? lockedApps.find((candidate) => candidate.id === appId)
    : lockedApps.length === 1
      ? lockedApps[0]
      : undefined;
  const selectionToken = app ? familyActivitySelectionsByAppId[app.id] : undefined;
  const [stepperMinutes, setStepperMinutes] = useState(0);
  // 한 번 완료하면 이동하는 동안 다시 눌러 해제가 중복되지 않게 막는다.
  const [isStarted, setIsStarted] = useState(false);

  // 스테퍼로 정한 시간을 사용 시간 막대에 실시간으로 반영한다. 화면을 떠나면 0으로 되돌린다.
  useEffect(() => {
    syncUsageBarExtraMinutes(stepperMinutes);
  }, [stepperMinutes]);

  useEffect(() => () => syncUsageBarExtraMinutes(0), []);

  const relockTimeLabel = formatTimeLabel(new Date(Date.now() + stepperMinutes * 60000));

  const handleDecrement = () => {
    setStepperMinutes((prev) => Math.max(prev - STEP_MINUTES, MIN_MINUTES));
  };

  const handleIncrement = () => {
    setStepperMinutes((prev) => Math.min(prev + STEP_MINUTES, MAX_MINUTES));
  };

  const handleConfirm = () => {
    if (isStarted) return;
    if (app) {
      extendUsage(app.id);

      const token = familyActivitySelectionsByAppId[app.id];
      if (token && stepperMinutes > 0) {
        unlockAppForMinutes(token, stepperMinutes);
        // 다시 잠기기 1분 전에 "곧 잠겨요" 알림을 보낸다.
        scheduleRelockWarning(app.id, new Date(Date.now() + stepperMinutes * 60000));
      }
    }

    // 해제를 시작하면 현황 화면(my-lock-status)으로 이동한다. "앱 잠금이 해제됐어요" 토스트는
    // 그 화면이 파라미터를 보고 2초 동안 띄운다.
    setIsStarted(true);
    router.dismissAll();
    router.replace({ pathname: '/(lock)/restricted-apps', params: { unlocked: '1' } });
  };

  return (
    <View style={styles.root}>
      <SafeAreaView edges={['top']} style={styles.safeArea}>
        <View style={styles.content}>
          {selectionToken ? (
            // 앱 이름은 토큰으로만 그릴 수 있어서 네이티브 라벨로 보여준다("Instagram,").
            <ScreenTimeReportView
              selectionTokens={[selectionToken]}
              reportStyle="nameCenter"
              style={styles.nameView}
            />
          ) : null}
          <Text style={styles.title}>
            {selectionToken ? '' : '이 앱, '}
            {relockTimeLabel} 에 다시 잠겨요.
          </Text>

          {selectionToken ? (
            // 이 앱의 오늘 사용 시간은 리포트 익스텐션만 알고 있어서, 막대와 라벨을 거기서 그린다.
            <ScreenTimeReportView
              selectionTokens={[selectionToken]}
              reportStyle="usageBar"
              style={styles.usageBarView}
            />
          ) : null}
        </View>

        <View style={styles.stepperRow}>
          <Pressable
            style={[
              styles.stepperButton,
              stepperMinutes <= MIN_MINUTES && styles.stepperButtonDisabled,
            ]}
            disabled={isStarted || stepperMinutes <= MIN_MINUTES}
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
            disabled={isStarted || stepperMinutes >= MAX_MINUTES}
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
          // 0분이면 해제할 시간이 없으니 완료할 수 없다.
          disabled={isStarted || stepperMinutes <= MIN_MINUTES}
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
    backgroundColor: '#FFFFFF',
  },
  safeArea: {
    flex: 1,
    paddingHorizontal: spacing[16],
    paddingBottom: spacing[16],
  },
  content: {
    paddingTop: spacing[32],
  },
  nameView: {
    height: 32,
  },
  title: {
    fontFamily: fontFamily.primary.regular,
    fontSize: 24,
    lineHeight: 32,
    letterSpacing: -0.48,
    color: gray[800],
    textAlign: 'left',
  },
  usageBarView: {
    height: 36,
    marginTop: spacing[24],
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
