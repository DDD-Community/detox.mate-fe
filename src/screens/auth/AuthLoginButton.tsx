import type { ImageSourcePropType } from 'react-native';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { primitiveColors, typography } from '@/lib/token';

const { gray } = primitiveColors;

type AuthLoginButtonVariant = 'kakao' | 'apple' | 'test';

interface AuthLoginButtonProps {
  variant: AuthLoginButtonVariant;
  label: string;
  pendingLabel?: string;
  iconSource?: ImageSourcePropType;
  disabled?: boolean;
  pending?: boolean;
  onPress?: () => void;
}

export function AuthLoginButton({
  variant,
  label,
  pendingLabel,
  iconSource,
  disabled = false,
  pending = false,
  onPress,
}: AuthLoginButtonProps) {
  const buttonText = pending && pendingLabel ? pendingLabel : label;
  const isIconButton = Boolean(iconSource);

  return (
    <TouchableOpacity
      style={[
        styles.button,
        variantStyles[variant].button,
        variant === 'test' && disabled && styles.testButtonDisabled,
      ]}
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.85}
    >
      {isIconButton ? (
        <View style={styles.buttonInner}>
          <Image source={iconSource} style={styles.icon} resizeMode="contain" />
          <Text style={[styles.iconButtonText, variantStyles[variant].text]}>{buttonText}</Text>
          <View style={styles.iconPlaceholder} />
        </View>
      ) : (
        <Text style={[styles.testButtonText, variantStyles[variant].text]}>{buttonText}</Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    height: 56,
    borderRadius: 18,
    justifyContent: 'center',
  },
  buttonInner: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
  },
  iconPlaceholder: {
    width: 18,
  },
  icon: {
    width: 18,
    height: 18,
  },
  iconButtonText: {
    flex: 1,
    ...typography.primary.body1B,
    textAlign: 'center',
  },
  testButtonText: {
    ...typography.primary.body1B,
    textAlign: 'center',
  },
  testButtonDisabled: {
    opacity: 0.6,
  },
});

const stylesByVariant = StyleSheet.create({
  kakaoButton: {
    backgroundColor: '#FEE500',
  },
  kakaoText: {
    color: '#191600',
  },
  appleButton: {
    backgroundColor: '#000000',
  },
  appleText: {
    color: '#FFFFFF',
  },
  testButton: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderColor: gray[200],
    borderWidth: 1,
  },
  testText: {
    color: gray[800],
  },
});

const variantStyles = {
  kakao: {
    button: stylesByVariant.kakaoButton,
    text: stylesByVariant.kakaoText,
  },
  apple: {
    button: stylesByVariant.appleButton,
    text: stylesByVariant.appleText,
  },
  test: {
    button: stylesByVariant.testButton,
    text: stylesByVariant.testText,
  },
};
