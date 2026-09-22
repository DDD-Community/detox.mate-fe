import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Icon } from '../../components/Icon';
import { primitiveColors, radius, spacing, typography } from '../../lib/token';
import { useLockStore } from '../../stores/lockStore';
import { GOAL_TIME_OPTIONS_MINUTES } from './mockLockApps';

const { gray, green } = primitiveColors;

const CONFIRM_DELAY_MS = 250;

const formatOptionLabel = (minutes: number) => `${minutes / 60}시간`;

// FamilyActivitySelection 토큰은 어떤 앱인지 알 수 없는 암호화된 값이라
// 이름 대신 선택된 개수만 제목에 쓴다.
const buildSelectedAppsTitle = (selectedAppCount: number) => {
  if (selectedAppCount === 0) return '선택된 앱 없음';
  return `선택한 앱 ${selectedAppCount}개`;
};

export default function GoalTimeScreen() {
  const router = useRouter();
  const { selectedAppCount, targetMinutes, confirmTargetMinutes } = useLockStore();
  const [pendingMinutes, setPendingMinutes] = useState<number | null>(null);

  useEffect(() => {
    if (pendingMinutes === null) return;

    const timer = setTimeout(() => {
      confirmTargetMinutes(pendingMinutes);
      router.dismissTo('/(lock)/restricted-apps');
    }, CONFIRM_DELAY_MS);

    return () => clearTimeout(timer);
  }, [pendingMinutes, confirmTargetMinutes, router]);

  const selectedMinutes = pendingMinutes ?? targetMinutes;

  return (
    <View style={styles.root}>
      <SafeAreaView edges={['top']} style={styles.topArea}>
        <View style={styles.topBar}>
          <Pressable hitSlop={8} onPress={() => router.back()}>
            <Icon name="caretLeft" size={22} color={gray[900]} />
          </Pressable>
          <Text style={styles.topBarTitle} numberOfLines={1}>
            {buildSelectedAppsTitle(selectedAppCount)}
          </Text>
          <View style={{ width: 22 }} />
        </View>
      </SafeAreaView>

      <View style={styles.sheet}>
        <View style={styles.sheetHandle} />
        <Text style={styles.sheetTitle}>목표 제한 시간을 설정해주세요.</Text>

        <View style={styles.optionList}>
          {GOAL_TIME_OPTIONS_MINUTES.map((minutes) => {
            const isSelected = selectedMinutes === minutes;
            return (
              <Pressable
                key={minutes}
                style={[styles.option, isSelected && styles.optionSelected]}
                onPress={() => setPendingMinutes(minutes)}
              >
                <Text style={[styles.optionLabel, isSelected && styles.optionLabelSelected]}>
                  {formatOptionLabel(minutes)}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: gray[50],
  },
  topArea: {
    backgroundColor: gray[50],
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing[16],
    height: 44,
  },
  topBarTitle: {
    ...typography.primary.body1M,
    color: gray[900],
    flex: 1,
    textAlign: 'center',
  },
  sheet: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: radius[16],
    borderTopRightRadius: radius[16],
    paddingHorizontal: spacing[16],
    paddingTop: spacing[12],
  },
  sheetHandle: {
    alignSelf: 'center',
    width: 36,
    height: 4,
    borderRadius: radius.full,
    backgroundColor: gray[100],
    marginBottom: spacing[20],
  },
  sheetTitle: {
    ...typography.primary.title2B,
    color: gray[900],
    marginBottom: spacing[16],
  },
  optionList: {
    gap: spacing[12],
  },
  option: {
    height: 56,
    borderRadius: radius[16],
    backgroundColor: green[75],
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionSelected: {
    backgroundColor: green[300],
  },
  optionLabel: {
    ...typography.primary.body1M,
    color: green[400],
  },
  optionLabelSelected: {
    color: '#FFFFFF',
  },
});
