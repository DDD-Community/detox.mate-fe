import { useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import LOGO_BLACK from '@assets/logo-black.png';
import { Button } from '../../components/Button';
import { Icon } from '../../components/Icon';
import { primitiveColors, radius, spacing, typography } from '../../lib/token';
import { getAppUnlockNotification } from '../../api';

const { gray } = primitiveColors;

const RESEND_COOLDOWN_MS = 5000;

const formatNowLabel = () => {
  const now = new Date();
  const hours = now.getHours();
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const period = hours < 12 ? 'AM' : 'PM';
  const displayHour = hours % 12 === 0 ? 12 : hours % 12;
  return `${displayHour}:${minutes} ${period}`;
};

/**
 * "지금 꼭 필요해요" 요청 후, 실제 푸시 알림을 탭할 때까지 대기하는 화면.
 * 알림 탭 시 라우팅은 app/_layout.tsx의 알림 응답 리스너에서 처리한다.
 */
export default function UnlockWaitingScreen() {
  const router = useRouter();
  const [isResending, setIsResending] = useState(false);
  const cooldownTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (cooldownTimerRef.current) clearTimeout(cooldownTimerRef.current);
    };
  }, []);

  const handleClose = () => {
    router.dismissTo('/(lock)/restricted-apps');
  };

  const handleResend = async () => {
    if (isResending) return;
    setIsResending(true);
    try {
      await getAppUnlockNotification().request();
    } catch {
      // 네트워크 실패는 전역 토스트가 안내
    } finally {
      cooldownTimerRef.current = setTimeout(() => setIsResending(false), RESEND_COOLDOWN_MS);
    }
  };

  return (
    <View style={styles.root}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.topBar}>
          <Pressable hitSlop={8} onPress={handleClose}>
            <Icon name="x" size={22} color={gray[300]} />
          </Pressable>
        </View>

        <View style={styles.notificationBanner}>
          <Image source={LOGO_BLACK} style={styles.bannerIcon} resizeMode="contain" />
          <View style={styles.bannerTextArea}>
            <View style={styles.bannerHeaderRow}>
              <Text style={styles.bannerTitle}>Detox mate</Text>
              <Text style={styles.bannerTime}>{formatNowLabel()}</Text>
            </View>
            <Text style={styles.bannerBody}>앱을 사용하려면, 이 알림을 클릭해주세요!</Text>
          </View>
        </View>

        <View style={styles.center}>
          <Image source={LOGO_BLACK} style={styles.mascot} resizeMode="contain" />
          <Text style={styles.message}>위 알림을 클릭해 주세요.</Text>
        </View>

        <Button
          label={isResending ? '재전송했어요' : '재전송하기'}
          variant="solid"
          color="primary"
          size="lg"
          disabled={isResending}
          onPress={handleResend}
          style={styles.resendButton}
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
    paddingHorizontal: spacing[16],
    paddingBottom: spacing[16],
  },
  topBar: {
    height: 44,
    justifyContent: 'center',
  },
  notificationBanner: {
    flexDirection: 'row',
    gap: spacing[12],
    backgroundColor: gray[800],
    borderRadius: radius[16],
    padding: spacing[12],
    alignItems: 'flex-start',
  },
  bannerIcon: {
    width: 20,
    height: 19,
    tintColor: '#FFFFFF',
    marginTop: spacing[2],
  },
  bannerTextArea: {
    flex: 1,
    gap: spacing[4],
  },
  bannerHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  bannerTitle: {
    ...typography.primary.body2B,
    color: '#FFFFFF',
  },
  bannerTime: {
    ...typography.primary.body3R,
    color: gray[400],
  },
  bannerBody: {
    ...typography.primary.body2R,
    color: gray[100],
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing[12],
  },
  mascot: {
    width: 48,
    height: 45,
    tintColor: '#FFFFFF',
  },
  message: {
    ...typography.primary.title2B,
    color: '#FFFFFF',
    textAlign: 'center',
  },
  resendButton: {
    width: '100%',
  },
});
