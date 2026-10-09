import { useRouter } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';

import { getAppUnlockNotification } from '../../api';
import { Button } from '../../components/Button';
import { SwimTurtle } from '../../components/SwimTurtle';
import { primitiveColors, spacing, typography } from '../../lib/token';

const { gray } = primitiveColors;

/**
 * 실기기 Screen Time 연동 전까지, 잠근 앱을 탭했을 때 실제로 열리는 것을 흉내 내는 프로토타입 화면.
 */
export default function AppShieldScreen() {
  const router = useRouter();
  const [isRequesting, setIsRequesting] = useState(false);

  const handleCloseApp = () => {
    if (router.canGoBack()) {
      router.back();
      return;
    }
    router.replace('/(tabs)/restricted-apps');
  };

  const handleRequestUnlock = async () => {
    if (isRequesting) return;
    setIsRequesting(true);
    try {
      await getAppUnlockNotification().request();
    } catch {
      // 네트워크 실패는 전역 토스트가 안내 — 화면 전환은 계속 진행
    } finally {
      setIsRequesting(false);
    }
    // 실기기 쉴드도 알림 탭 시 이 경로로 바로 이동한다(app/_layout.tsx 리스너 참고).
    // 여기서도 동일하게, 알림 탭을 기다리지 않고 바로 타이머 화면으로 이동한다.
    router.replace('/(lock)/unlock-timer');
  };

  return (
    <SafeAreaProvider>
      <View style={styles.root}>
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.center}>
            <SwimTurtle size={35} />
            <Text style={styles.message}>
              해제하면 친구에게 알림이 가요!{'\n'}지금 꼭 해제 해야하나요?
            </Text>
          </View>

          <View style={styles.actions}>
            <Button
              label="아니요, 안 해도 괜찮아요"
              variant="solid"
              color="primary"
              size="lg"
              onPress={handleCloseApp}
              style={styles.actionButton}
            />
            <Button
              label="지금 꼭 필요해요"
              variant="solid"
              color="neutral"
              size="lg"
              disabled={isRequesting}
              onPress={handleRequestUnlock}
              style={styles.actionButton}
            />
          </View>
        </SafeAreaView>
      </View>
    </SafeAreaProvider>
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
    gap: spacing[12],
  },
  message: {
    ...typography.primary.title2B,
    color: '#FFFFFF',
    textAlign: 'center',
  },
  actions: {
    gap: spacing[12],
  },
  actionButton: {
    width: '100%',
  },
});
