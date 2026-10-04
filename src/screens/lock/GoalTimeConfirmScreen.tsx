import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { spacing } from '../../lib/token';
import { useLockStore } from '../../stores/lockStore';
import { pickRandomFriendNames } from './mockLockApps';
import { SentenceTypingChallengeScreen } from './SentenceTypingChallengeScreen';
import { TenSecondCountdownScreen } from './TenSecondCountdownScreen';

/**
 * 목표 시간을 새로 정하고 "다음"을 누르면 뜨는 다짐/알림 화면.
 *
 * - 처음 설정(mode 없음): 10초 카운트다운 연출만 보여주고, 기다리지 않아도 "확인"으로
 *   바로 넘어갈 수 있다.
 * - 이미 정해둔 목표를 완화하려는 경우(mode === 'change'): 더 신중하게 만들기 위해
 *   10초 대신 문장 따라 쓰기를 통과해야만 "확인"이 가능하다.
 */
export default function GoalTimeConfirmScreen() {
  const router = useRouter();
  const { hours, mode } = useLocalSearchParams<{ hours: string; mode?: string }>();
  const { confirmTargetMinutes } = useLockStore();
  const [notifiedFriends] = useState(() => pickRandomFriendNames(3));

  const handleConfirm = () => {
    confirmTargetMinutes(Number(hours) * 60);
    router.dismissTo('/(lock)/restricted-apps');
  };

  if (mode === 'change') {
    return (
      <SentenceTypingChallengeScreen
        title="이번 목표 꼭 지켜봐요."
        instruction="밑의 글을 따라쓰며 다짐해요!"
        onConfirm={handleConfirm}
      />
    );
  }

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
