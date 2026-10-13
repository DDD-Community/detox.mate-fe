import { useRef, type ReactNode } from 'react';
import { Alert, Pressable, StyleSheet } from 'react-native';

const TAP_WINDOW_MS = 5000;
const TAP_COUNT = 5;

interface TestLoginTriggerProps {
  children: ReactNode;
  disabled: boolean;
  onSelectAccount: (testUserKey: string) => void;
}

export function TestLoginTrigger({ children, disabled, onSelectAccount }: TestLoginTriggerProps) {
  const gesture = useRef({ startedAt: 0, count: 0 });

  const handlePress = () => {
    if (disabled) return;

    const now = Date.now();
    if (now - gesture.current.startedAt > TAP_WINDOW_MS) {
      gesture.current.startedAt = now;
      gesture.current.count = 0;
    }
    gesture.current.count += 1;
    if (gesture.current.count < TAP_COUNT) return;

    gesture.current.count = 0;
    gesture.current.startedAt = 0;
    Alert.alert('테스트 계정 로그인', '로그인할 계정을 선택하세요.', [
      { text: 'A 로그인', onPress: () => onSelectAccount('test1') },
      { text: 'B 로그인', onPress: () => onSelectAccount('test2') },
      { text: '취소', style: 'cancel' },
    ]);
  };

  return (
    <Pressable
      style={styles.trigger}
      onPress={handlePress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel="디톡스메이트 소개"
    >
      {children}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  trigger: {
    flex: 1,
  },
  image: {
    width: '100%',
    height: '100%',
  },
});
