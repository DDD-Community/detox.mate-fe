import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';

import LOGO_BLACK from '@assets/logo-black.png';
import { Button } from '../../components/Button';
import { primitiveColors, spacing, typography } from '../../lib/token';
import { getAppUnlockNotification } from '../../api';
import { useLockStore } from '../../stores/lockStore';

const { gray } = primitiveColors;

/**
 * 실기기 Screen Time 연동 전까지, 잠근 앱을 탭했을 때 실제로 열리는 것을 흉내 내는 프로토타입 화면.
 */
export default function AppShieldScreen() {
  const router = useRouter();
  const { appId } = useLocalSearchParams<{ appId: string }>();
  const { lockedApps } = useLockStore();
  const [isRequesting, setIsRequesting] = useState(false);

  const app = lockedApps.find((candidate) => candidate.id === appId);

  const handleCloseApp = () => {
    if (router.canGoBack()) {
      router.back();
      return;
    }
    router.replace('/(lock)/restricted-apps');
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
    router.replace({ pathname: '/(lock)/unlock-waiting', params: { appId } });
  };

  return (
    <SafeAreaProvider>
      <View style={styles.root}>
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.center}>
            <Image source={LOGO_BLACK} style={styles.mascot} resizeMode="contain" />
            <Text style={styles.appName}>{app?.name ?? '이 앱'}</Text>
            <Text style={styles.message}>
              해제하면 친구에게 알림이 가요!{'\n'}지금 꼭 해제 해야하나요?
            </Text>
          </View>

          <View style={styles.actions}>
            <Button
              label="지금 꼭 필요해요"
              variant="solid"
              color="primary"
              size="lg"
              disabled={isRequesting}
              onPress={handleRequestUnlock}
              style={styles.actionButton}
            />
            <Button
              label="아니요, 안해도 괜찮아요"
              variant="outlined"
              color="assistive"
              size="lg"
              onPress={handleCloseApp}
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
  mascot: {
    width: 48,
    height: 45,
    tintColor: '#FFFFFF',
    marginBottom: spacing[8],
  },
  appName: {
    ...typography.primary.body2R,
    color: gray[300],
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
