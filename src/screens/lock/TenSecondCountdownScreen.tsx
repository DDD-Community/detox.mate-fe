import { Fragment, type ReactNode } from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

import DETOXMATE_LOGO from '@assets/detoxmate-logo.png';
import { Button } from '../../components/Button';
import { fontFamily, primitiveColors, spacing, typography } from '../../lib/token';
import { useCountdown } from './useCountdown';

const { gray, green, system } = primitiveColors;

const COUNTDOWN_START_SECONDS = 10;
const RING_SIZE = 250;
const RING_STROKE = 8;
const RING_RADIUS = (RING_SIZE - RING_STROKE) / 2;
// 피그마: 제목→안내 36, 안내 문구→알림 카드 8, 위 블록→타이머 링 64.
const NOTIFY_BLOCK_TOP_GAP = 36;
const RING_TOP_GAP = 64;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;

const formatSeconds = (seconds: number) => `00 : ${String(seconds).padStart(2, '0')}`;

export interface TenSecondCountdownScreenProps {
  title: string;
  /** 알림이 가는 친구 이름. 없으면 안내 문구를 숨긴다(임시 해제 타이머). */
  notifiedFriends?: string[];
  /** 안내 문구 자리에 직접 넣을 노드(조건부 안내용). 있으면 notifiedFriends 대신 이걸 그린다. */
  notice?: ReactNode;
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
  notice,
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
        {notice ? (
          <View style={styles.noticeSlot}>{notice}</View>
        ) : notifiedFriends ? (
          <Text style={styles.notifyText}>
            <Text style={styles.notifyTextHighlight}>
              {notifiedFriends.map((name) => `${name}님`).join(', ')}
            </Text>
            에게 알림이 가요.
          </Text>
        ) : null}
        {notificationPreview ? (
          <View style={styles.previewCard}>
            <Image source={DETOXMATE_LOGO} style={styles.previewIcon} />
            <View style={styles.previewTexts}>
              <Text style={styles.previewTitle}>Detox mate</Text>
              <Text style={styles.previewBody}>{notificationPreview}</Text>
            </View>
          </View>
        ) : null}

        <View style={{ width: RING_SIZE, height: RING_SIZE, marginTop: RING_TOP_GAP }}>
          <Svg width={RING_SIZE} height={RING_SIZE}>
            <Circle
              cx={RING_SIZE / 2}
              cy={RING_SIZE / 2}
              r={RING_RADIUS}
              stroke={gray[50]}
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
  // 피그마 title3/Medium: 24/32.
  title: {
    ...typography.primary.h3,
    fontFamily: fontFamily.primary.medium,
    fontWeight: '500',
    color: gray[800],
    textAlign: 'center',
  },
  notifyText: {
    ...typography.primary.body3R,
    color: gray[800],
    textAlign: 'center',
    marginTop: NOTIFY_BLOCK_TOP_GAP,
  },
  noticeSlot: {
    alignSelf: 'stretch',
    marginTop: NOTIFY_BLOCK_TOP_GAP,
  },
  notifyTextHighlight: {
    color: system.green.opacity100,
  },
  // 피그마 "Notification - Collapsed": iOS 푸시 알림 목업(SF 폰트, 10.38/13.84).
  previewCard: {
    alignSelf: 'stretch',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9.3,
    marginTop: spacing[8],
    paddingHorizontal: 13,
    paddingTop: 13,
    paddingBottom: 11,
    borderRadius: 24,
    backgroundColor: gray[50],
  },
  previewIcon: {
    width: 35.34,
    height: 35.34,
    borderRadius: 8.5,
  },
  previewTexts: {
    flex: 1,
  },
  previewTitle: {
    fontSize: 10.38,
    lineHeight: 13.84,
    letterSpacing: -0.21,
    fontWeight: '600',
    color: '#000000',
  },
  previewBody: {
    fontSize: 10.38,
    lineHeight: 13.84,
    letterSpacing: -0.21,
    color: '#000000',
  },
  ringCenter: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // 피그마: Pretendard Regular 32/44, 자간 -0.64.
  ringValue: {
    fontFamily: fontFamily.primary.regular,
    fontSize: 32,
    lineHeight: 44,
    letterSpacing: -0.64,
    color: '#000000',
  },
  cancelButton: {
    width: '100%',
  },
});
