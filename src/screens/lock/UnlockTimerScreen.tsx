import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { minimizeApp } from '../../../modules/screen-time-report';
import { spacing } from '../../lib/token';
import { pickRandomFriendNames } from './mockLockApps';
import { TenSecondCountdownScreen } from './TenSecondCountdownScreen';

/**
 * 알림 탭(또는 쉴드에서 바로) 후 뜨는 10초 재고 화면. 시간이 다 되면 몇 분 더
 * 사용할지 설정하는 화면으로 이동한다. "안해도 될 것 같아요"는 iOS가 앱 자체 종료를
 * 허용하지 않아서, 홈 버튼을 누른 것처럼 백그라운드로 내려보낸다.
 */
export default function UnlockTimerScreen() {
  const router = useRouter();
  const { appId } = useLocalSearchParams<{ appId?: string }>();
  const [notifiedFriends] = useState(() => pickRandomFriendNames(3));

  return (
    <View style={styles.root}>
      <SafeAreaView style={styles.safeArea}>
        <TenSecondCountdownScreen
          title="10초 동안 다시 생각해볼까요?"
          notifiedFriends={notifiedFriends}
          cancelLabel="안해도 될 것 같아요"
          onCancel={minimizeApp}
          onComplete={() =>
            router.replace({
              pathname: '/(lock)/unlock-duration',
              params: appId ? { appId } : {},
            })
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
