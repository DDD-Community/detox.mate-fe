import { Fragment } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

import { Button } from '../../components/Button';
import { primitiveColors, radius, spacing, typography } from '../../lib/token';
import { useCountdown } from './useCountdown';

const { gray, green, system } = primitiveColors;

const COUNTDOWN_START_SECONDS = 10;
const RING_SIZE = 250;
const RING_STROKE = 16;
const RING_RADIUS = (RING_SIZE - RING_STROKE) / 2;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;

const formatSeconds = (seconds: number) => `00 : ${String(seconds).padStart(2, '0')}`;

export interface TenSecondCountdownScreenProps {
  title: string;
  /** 알림이 가는 친구 이름. 없으면 안내 문구를 숨긴다(임시 해제 타이머). */
  notifiedFriends?: string[];
  /** 친구에게 갈 푸시 알림 미리보기 문구. 없으면 미리보기를 숨긴다. */
  notificationPreview?: string;
  /** 앱이 백그라운드에 가 있는 동안 타이머를 멈출지. */
  pauseInBackground?: boolean;
  cancelLabel: string;
  onCancel: () => void;
  onComplete: () => void;
}

/**
 * 10초 재고 화면 공통 레이아웃. 등록 해제(UnregisterTimerScreen)와 임시 해제
 * (UnlockTimerScreen) 양쪽에서 문구/버튼 동작만 바꿔서 재사용한다.
 */
export function TenSecondCountdownScreen({
  title,
  notifiedFriends,
  notificationPreview,
  pauseInBackground,
  cancelLabel,
  onCancel,
  onComplete,
}: TenSecondCountdownScreenProps) {
  const secondsLeft = useCountdown(COUNTDOWN_START_SECONDS, onComplete, pauseInBackground);
  const progress = secondsLeft / COUNTDOWN_START_SECONDS;

  return (
    <Fragment>
      <View style={styles.center}>
        <Text style={styles.title}>{title}</Text>
        {notifiedFriends ? (
          <Text style={styles.notifyText}>
            <Text style={styles.notifyTextHighlight}>
              {notifiedFriends.map((name) => `${name}님`).join(', ')}
            </Text>
            에게 알림이 가요.
          </Text>
        ) : null}
        {notificationPreview ? (
          <View style={styles.previewCard}>
            <View style={styles.previewIcon} />
            <View style={styles.previewTexts}>
              <Text style={styles.previewTitle}>Detox mate</Text>
              <Text style={styles.previewBody}>{notificationPreview}</Text>
            </View>
          </View>
        ) : null}

        <View style={{ width: RING_SIZE, height: RING_SIZE, marginTop: spacing[24] }}>
          <Svg width={RING_SIZE} height={RING_SIZE}>
            <Circle
              cx={RING_SIZE / 2}
              cy={RING_SIZE / 2}
              r={RING_RADIUS}
              stroke={gray[100]}
              strokeWidth={RING_STROKE}
              fill="none"
            />
            <Circle
              cx={RING_SIZE / 2}
              cy={RING_SIZE / 2}
              r={RING_RADIUS}
              stroke={green[300]}
              strokeWidth={RING_STROKE}
              strokeLinecap="round"
              fill="none"
              strokeDasharray={`${RING_CIRCUMFERENCE} ${RING_CIRCUMFERENCE}`}
              strokeDashoffset={RING_CIRCUMFERENCE * (1 - progress)}
              transform={`rotate(-90 ${RING_SIZE / 2} ${RING_SIZE / 2})`}
            />
          </Svg>
          <View style={styles.ringCenter}>
            <Text style={styles.ringValue}>{formatSeconds(secondsLeft)}</Text>
          </View>
        </View>
      </View>

      <Button
        label={cancelLabel}
        variant="solid"
        color="primary"
        size="lg"
        onPress={onCancel}
        style={styles.cancelButton}
      />
    </Fragment>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    ...typography.primary.title2B,
    color: gray[800],
    textAlign: 'center',
  },
  notifyText: {
    ...typography.primary.caption,
    color: gray[800],
    textAlign: 'center',
    marginTop: spacing[8],
  },
  notifyTextHighlight: {
    color: system.green.opacity100,
  },
  previewCard: {
    alignSelf: 'stretch',
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[12],
    marginTop: spacing[16],
    padding: spacing[12],
    borderRadius: radius[16],
    backgroundColor: gray[50],
  },
  previewIcon: {
    width: 36,
    height: 36,
    borderRadius: radius[8],
    backgroundColor: gray[100],
  },
  previewTexts: {
    flex: 1,
  },
  previewTitle: {
    ...typography.primary.caption,
    color: gray[800],
    fontWeight: '700',
  },
  previewBody: {
    ...typography.primary.caption,
    color: gray[800],
  },
  ringCenter: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ringValue: {
    ...typography.accent.h3,
    color: '#000000',
  },
  cancelButton: {
    width: '100%',
  },
});
