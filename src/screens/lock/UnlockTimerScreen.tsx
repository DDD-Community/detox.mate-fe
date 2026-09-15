import { useRouter } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Circle } from 'react-native-svg';

import { Button } from '../../components/Button';
import { primitiveColors, spacing, typography } from '../../lib/token';
import { pickRandomFriendNames } from './mockLockApps';
import { useCountdown } from './useCountdown';

const { gray, green } = primitiveColors;

const COUNTDOWN_START_SECONDS = 10;
const RING_SIZE = 220;
const RING_STROKE = 16;
const RING_RADIUS = (RING_SIZE - RING_STROKE) / 2;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;

const formatSeconds = (seconds: number) => `00:${String(seconds).padStart(2, '0')}`;

/**
 * 알림 탭 후 뜨는 10초 대기 화면. 시간이 다 되면 몇 분 더 사용할지 설정하는 화면으로 이동한다.
 */
export default function UnlockTimerScreen() {
  const router = useRouter();
  const [notifiedFriends] = useState(() => pickRandomFriendNames(3));
  const secondsLeft = useCountdown(COUNTDOWN_START_SECONDS, () => {
    router.replace('/(lock)/unlock-duration');
  });

  const progress = secondsLeft / COUNTDOWN_START_SECONDS;

  const handleCancel = () => {
    router.dismissAll();
    router.replace('/(lock)/restricted-apps');
  };

  return (
    <View style={styles.root}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.center}>
          <Text style={styles.notifyText}>
            {notifiedFriends.map((name) => `${name}님`).join(', ')}에게 알림이 가요.
          </Text>
          <Text style={styles.title}>10초 동안 다시 생각해볼까요?</Text>

          <View style={{ width: RING_SIZE, height: RING_SIZE }}>
            <Svg width={RING_SIZE} height={RING_SIZE}>
              <Circle
                cx={RING_SIZE / 2}
                cy={RING_SIZE / 2}
                r={RING_RADIUS}
                stroke={gray[800]}
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
          label="안해도 될 것 같아요"
          variant="solid"
          color="primary"
          size="lg"
          onPress={handleCancel}
          style={styles.cancelButton}
        />
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: gray[900],
  },
  safeArea: {
    flex: 1,
    justifyContent: 'space-between',
    paddingHorizontal: spacing[16],
    paddingBottom: spacing[16],
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing[24],
  },
  title: {
    ...typography.primary.title2B,
    color: '#FFFFFF',
    textAlign: 'center',
  },
  ringCenter: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ringValue: {
    ...typography.accent.h2,
    color: '#FFFFFF',
  },
  notifyText: {
    ...typography.primary.body2R,
    color: gray[400],
    textAlign: 'center',
  },
  cancelButton: {
    width: '100%',
  },
});
