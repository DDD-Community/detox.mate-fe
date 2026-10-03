import { Fragment } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

import { Button } from '../../components/Button';
import { primitiveColors, spacing, typography } from '../../lib/token';
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
  notifiedFriends: string[];
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
  cancelLabel,
  onCancel,
  onComplete,
}: TenSecondCountdownScreenProps) {
  const secondsLeft = useCountdown(COUNTDOWN_START_SECONDS, onComplete);
  const progress = secondsLeft / COUNTDOWN_START_SECONDS;

  return (
    <Fragment>
      <View style={styles.center}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.notifyText}>
          <Text style={styles.notifyTextHighlight}>
            {notifiedFriends.map((name) => `${name}님`).join(', ')}
          </Text>
          에게 알림이 가요.
        </Text>

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
