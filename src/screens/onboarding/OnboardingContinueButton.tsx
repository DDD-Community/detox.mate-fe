import { StyleSheet, type StyleProp, type TextStyle } from 'react-native';
import { Button } from '@/components';
import { radius } from '@/lib/token';

type Props = {
  label: string;
  disabled: boolean;
  onPress: () => void;
  labelStyle?: StyleProp<TextStyle>;
};

// Figma 온보딩 CTA 치수는 기본 Button 크기와 달라 이 컴포넌트에서 공유한다.
const BUTTON_HEIGHT = 52.46;

export function OnboardingContinueButton({ label, disabled, onPress, labelStyle }: Props) {
  return (
    <Button
      label={label}
      disabled={disabled}
      onPress={onPress}
      style={styles.button}
      labelStyle={[styles.label, labelStyle]}
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
