import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Icon } from '@/components';
import { fontFamily, primitiveColors } from '@/lib/token';

export function GoalTimeCard({
  hours,
  onChange,
  showChangeHint = false,
}: {
  hours: number;
  onChange: (hours: number) => void;
  showChangeHint?: boolean;
}) {
  return (
    <View style={styles.card}>
      <Text style={styles.title}>목표 제한시간을 설정해주세요.</Text>
      <Text style={styles.description}>
        하루에 몇 시간으로 제한하고 싶나요?{'\n'}제한시간 보다 더 사용하면 친구에게 알림이 가요.
        {showChangeHint ? '\n나중에 변경 가능해요.' : ''}
      </Text>
      <View style={styles.stepper}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="목표 시간 줄이기"
          accessibilityState={{ disabled: hours === 0 }}
          disabled={hours === 0}
          onPress={() => onChange(hours - 1)}
          hitSlop={8}
        >
          <Icon name="minusCircle" size={52} weight="fill" color={primitiveColors.green[300]} />
        </Pressable>
        <Text style={styles.value} accessibilityLiveRegion="polite">
          {hours} 시간
        </Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="목표 시간 늘리기"
          accessibilityState={{ disabled: hours === 4 }}
          disabled={hours === 4}
          onPress={() => onChange(hours + 1)}
          hitSlop={8}
        >
          <Icon name="plusCircle" size={52} weight="fill" color={primitiveColors.green[300]} />
        </Pressable>
      </View>
    </View>
  );
}
const styles = StyleSheet.create({
  card: {
    backgroundColor: primitiveColors.green[50],
    borderRadius: 30,
    paddingVertical: 42,
    alignItems: 'center',
  },
  title: {
    fontFamily: fontFamily.primary.bold,
    fontSize: 24,
    lineHeight: 32,
    textAlign: 'center',
    color: primitiveColors.gray[800],
  },
  description: {
    marginTop: 24,
    fontFamily: fontFamily.primary.regular,
    fontSize: 14,
    lineHeight: 20,
    color: '#000000',
    textAlign: 'center',
  },
  stepper: {
    marginTop: 43,
    marginHorizontal: 21,
    alignSelf: 'stretch',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  value: {
    fontFamily: fontFamily.primary.regular,
    fontSize: 48,
    lineHeight: 52,
    letterSpacing: -0.96,
    color: '#000000',
  },
});
