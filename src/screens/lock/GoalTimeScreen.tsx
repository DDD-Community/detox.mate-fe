import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from '../../components/Button';
import { Icon } from '../../components/Icon';
import { Toast } from '../../components/Toast';
import { primitiveColors, spacing, typography } from '../../lib/token';
import { GoalTimeCard } from './GoalTimeCard';
import { useLockStore } from '../../stores/lockStore';

const { gray, system } = primitiveColors;

const MIN_HOURS = 0;
const MAX_HOURS = 4;

// 실제 차단은 앱을 등록하는 시점(SelectAppsScreen)에 이미 걸린다.
// 여기서는 앱 전체에 공통으로 적용되는 목표 시간(표시/추적용)만 저장한다.
export default function GoalTimeScreen() {
  const router = useRouter();
  const { mode } = useLocalSearchParams<{ mode?: string }>();
  const { targetMinutes } = useLockStore();
  // 아직 제한 시간을 정한 적 없으면 스테퍼는 최소값에서 시작한다.
  const [hours, setHours] = useState(() =>
    targetMinutes === null
      ? MIN_HOURS
      : Math.min(Math.max(Math.round(targetMinutes / 60), MIN_HOURS), MAX_HOURS)
  );

  const isChangeMode = mode === 'change';
  // 변경 모드에서 기존 제한 시간과 같은 값이면 "다음"을 막고 안내 토스트를 띄운다.
  const isUnchanged = isChangeMode && hours * 60 === targetMinutes;

  const handleNext = () => {
    router.push({
      pathname: '/(lock)/goal-time-confirm',
      params: { hours: String(hours), ...(mode ? { mode } : {}) },
    });
  };

  return (
    <View style={styles.root}>
      <SafeAreaView edges={['top']} style={styles.safeArea}>
        <View style={styles.header}>
          <Pressable hitSlop={8} onPress={() => router.back()}>
            <Icon name="caretLeft" size={22} color={gray[900]} />
          </Pressable>
          {isChangeMode ? <Text style={styles.headerTitle}>제한 시간 변경</Text> : null}
        </View>

        <GoalTimeCard hours={hours} onChange={setHours} />

        <Toast
          visible={isUnchanged}
          message="기존에 설정한 제한 시간과 동일해요"
          icon={<Icon name="warningCircle" size={16} weight="fill" color={system.red.opacity100} />}
          position="aboveCta"
        />

        <Button
          label="다음"
          variant="solid"
          color="primary"
          size="lg"
          disabled={isUnchanged}
          onPress={handleNext}
          style={styles.confirmButton}
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
    justifyContent: 'space-between',
    paddingHorizontal: spacing[16],
    paddingBottom: spacing[16],
  },
  header: {
    height: 44,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[8],
  },
  headerTitle: {
    ...typography.primary.title1M,
    color: gray[800],
  },
  confirmButton: {
    width: '100%',
  },
});
