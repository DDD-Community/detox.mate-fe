import { useRef } from 'react';
import { Alert, Image, Pressable, StyleSheet } from 'react-native';

import TURTLE_HI_IMAGE from '@assets/turtle-hi.png';

const TAP_WINDOW_MS = 5000;
const TAP_COUNT = 5;

interface TestLoginTriggerProps {
  disabled: boolean;
  onSelectAccount: (testUserKey: string) => void;
}

export function TestLoginTrigger({ disabled, onSelectAccount }: TestLoginTriggerProps) {
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
      { text: 'A 로그인', onPress: () => onSelectAccount('front-a') },
      { text: 'B 로그인', onPress: () => onSelectAccount('front-b') },
      { text: '취소', style: 'cancel' },
    ]);
  };

  return (
    <Pressable
      style={styles.trigger}
      onPress={handlePress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel="거북이"
    >
      <Image source={TURTLE_HI_IMAGE} style={styles.image} resizeMode="contain" />
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
