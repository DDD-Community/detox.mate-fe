import { useLocalSearchParams, useRouter } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { useSaveGoalTime } from './useSaveGoalTime';
import { SentenceTypingChallengeScreen } from './SentenceTypingChallengeScreen';

/**
 * 제한된 앱 현황의 [변경]으로 목표 시간을 바꾸고 "다음"을 누르면 뜨는 다짐 화면.
 * 문장 따라 쓰기를 통과해야만 "확인"이 가능하다. 목표 시간은 온보딩에서 처음 정하고, 그 뒤로는
 * 이 경로(제한 시간 변경 → 필사)로만 바꾼다.
 */
export default function GoalTimeConfirmScreen() {
  const router = useRouter();
  const { hours, mode } = useLocalSearchParams<{ hours: string; mode?: string }>();
  const { save, errorMessage } = useSaveGoalTime(mode ?? 'change');

  const handleConfirm = async () => {
    if (!(await save(Number(hours) * 60))) return;
    router.dismissTo({
      pathname: '/(tabs)/restricted-apps',
      // 변경 완료 토스트를 띄우도록 현황 화면에 알린다.
      params: { goalChanged: '1' },
    });
  };

  return (
    <View style={styles.root}>
      <SentenceTypingChallengeScreen
        title="이번 목표 꼭 지켜봐요."
        instruction="밑의 글을 따라쓰며 다짐해요!"
        onConfirm={handleConfirm}
      />
      {errorMessage && <Text accessibilityRole="alert">{errorMessage}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
});
