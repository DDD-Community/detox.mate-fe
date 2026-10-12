import { StyleSheet } from 'react-native';
import { Button } from '@/components';
import { radius } from '@/lib/token';

type Props = {
  label: string;
  disabled: boolean;
  onPress: () => void;
};

// Figma 온보딩 CTA 치수는 기본 Button 크기와 달라 이 컴포넌트에서 공유한다.
const BUTTON_HEIGHT = 52.46;

export function OnboardingContinueButton({ label, disabled, onPress }: Props) {
  return (
    <Button
      label={label}
      disabled={disabled}
      onPress={onPress}
      style={styles.button}
      labelStyle={styles.label}
    />
  );
}

const styles = StyleSheet.create({
  button: {
    width: '100%',
    borderRadius: radius.full,
    height: BUTTON_HEIGHT,
    minHeight: BUTTON_HEIGHT,
  },
  label: { fontSize: 17.62, lineHeight: 26.423, letterSpacing: -0.3524 },
});
