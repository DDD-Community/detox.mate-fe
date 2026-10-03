import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { spacing } from '../../lib/token';
import { pickRandomFriendNames } from './mockLockApps';
import { TenSecondCountdownScreen } from './TenSecondCountdownScreen';

/**
 * "등록 해제" 요청 직후 10초 재고 화면. 시간이 다 되면 사유 선택 화면으로 넘어간다.
 */
export default function UnregisterTimerScreen() {
  const router = useRouter();
  const { appId } = useLocalSearchParams<{ appId: string }>();
  const [notifiedFriends] = useState(() => pickRandomFriendNames(3));

  return (
    <View style={styles.root}>
      <SafeAreaView style={styles.safeArea}>
        <TenSecondCountdownScreen
          title="10초 동안 다시 생각해볼까요?"
          notifiedFriends={notifiedFriends}
          cancelLabel="해제 안 할래요"
          onCancel={() => router.back()}
          onComplete={() =>
            router.replace({ pathname: '/(lock)/unregister-reason', params: { appId } })
          }
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
});
