import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from '../../components/Button';
import { Icon } from '../../components/Icon';
import { fontFamily, primitiveColors, radius, spacing, typography } from '../../lib/token';
import { useLockStore } from '../../stores/lockStore';

const { gray, green } = primitiveColors;

const MIN_HOURS = 1;
const MAX_HOURS = 12;

// 실제 차단은 앱을 등록하는 시점(SelectAppsScreen)에 이미 걸린다.
// 여기서는 앱 전체에 공통으로 적용되는 목표 시간(표시/추적용)만 저장한다.
export default function GoalTimeScreen() {
  const router = useRouter();
  const { targetMinutes } = useLockStore();
  const [hours, setHours] = useState(() =>
    Math.min(Math.max(Math.round(targetMinutes / 60), MIN_HOURS), MAX_HOURS)
  );

  const handleNext = () => {
    router.push({ pathname: '/(lock)/goal-time-confirm', params: { hours: String(hours) } });
  };

  return (
    <View style={styles.root}>
      <SafeAreaView edges={['top']} style={styles.safeArea}>
        <View style={styles.card}>
          <Text style={styles.title}>목표 제한 시간을 설정해주세요.</Text>
          <Text style={styles.subtitle}>
            하루에 몇 시간으로 제한하고 싶나요?{'\n'}제한 시간 보다 더 사용하면 친구에게 알림이
            가요.
          </Text>

          <View style={styles.stepperRow}>
            <Pressable
              hitSlop={8}
              disabled={hours <= MIN_HOURS}
              onPress={() => setHours((prev) => Math.max(prev - 1, MIN_HOURS))}
            >
              <Icon
                name="minusCircle"
                size={52}
                weight="fill"
                color={hours <= MIN_HOURS ? gray[100] : green[300]}
              />
            </Pressable>
            <Text style={styles.stepperValue}>{hours} 시간</Text>
            <Pressable
              hitSlop={8}
              disabled={hours >= MAX_HOURS}
              onPress={() => setHours((prev) => Math.min(prev + 1, MAX_HOURS))}
            >
              <Icon
                name="plusCircle"
                size={52}
                weight="fill"
                color={hours >= MAX_HOURS ? gray[100] : green[300]}
              />
            </Pressable>
          </View>
        </View>

        <Button
          label="다음"
          variant="solid"
          color="primary"
          size="lg"
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
  card: {
    backgroundColor: green[50],
    borderRadius: radius[16],
    paddingVertical: spacing[32],
    paddingHorizontal: spacing[16],
    alignItems: 'center',
    gap: spacing[32],
    marginTop: spacing[32],
  },
  title: {
    ...typography.primary.h3,
    color: gray[800],
    textAlign: 'center',
  },
  subtitle: {
    ...typography.primary.body2R,
    color: '#000000',
    textAlign: 'center',
    marginTop: spacing[16],
  },
  stepperRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[24],
  },
  stepperValue: {
    fontFamily: fontFamily.primary.regular,
    fontSize: 48,
    fontWeight: '400',
    lineHeight: 66,
    color: '#000000',
    minWidth: 140,
    textAlign: 'center',
  },
  confirmButton: {
    width: '100%',
  },
});
