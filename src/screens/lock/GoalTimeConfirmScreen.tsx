import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { spacing } from '../../lib/token';
import { useLockStore } from '../../stores/lockStore';
import { pickRandomFriendNames } from './mockLockApps';
import { TenSecondCountdownScreen } from './TenSecondCountdownScreen';

/**
 * 목표 시간을 새로 정하고 "다음"을 누르면 뜨는 다짐/알림 화면.
 * 10초 카운트다운은 순수 연출용이라, "확인"은 카운트다운을 기다리지 않고도 바로 누를 수 있다.
 */
export default function GoalTimeConfirmScreen() {
  const router = useRouter();
  const { hours } = useLocalSearchParams<{ hours: string }>();
  const { confirmTargetMinutes } = useLockStore();
  const [notifiedFriends] = useState(() => pickRandomFriendNames(3));

  const handleConfirm = () => {
    confirmTargetMinutes(Number(hours) * 60);
    router.dismissTo('/(lock)/restricted-apps');
  };

  return (
    <View style={styles.root}>
      <SafeAreaView style={styles.safeArea}>
        <TenSecondCountdownScreen
          title="이번 목표 꼭 지켜봐요."
          notifiedFriends={notifiedFriends}
          cancelLabel="확인"
          onCancel={handleConfirm}
          onComplete={handleConfirm}
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
