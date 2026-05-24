import { router } from 'expo-router';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';

import ONBOARDING_CHECK_IMAGE from '@assets/onboarding-check.png';

import { primitiveColors, typography } from '@/lib/token';
import { VerifyBottomSheet } from './VerifyBottomSheet';

const { green } = primitiveColors;

export default function VerifyCompleteScreen() {
  const handleGoHome = () => {
    router.replace('/(feed)/home');
  };

  return (
    <VerifyBottomSheet onDismiss={() => router.back()}>
      <View style={styles.content}>
        <View style={styles.heading}>
          <Image source={ONBOARDING_CHECK_IMAGE} style={styles.checkIcon} resizeMode="contain" />
          <Text style={styles.title}>{'인증 완료 !\n오늘도 잘 해냈어요 !'}</Text>
        </View>

        <Pressable style={styles.button} onPress={handleGoHome}>
          <Text style={styles.buttonLabel}>홈으로 돌아가기</Text>
        </Pressable>
      </View>
    </VerifyBottomSheet>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: 40,
  },
  heading: {
    alignItems: 'center',
    gap: 12,
  },
  checkIcon: {
    width: 60,
    height: 60,
  },
  title: {
    ...typography.accent.h3,
    color: '#2B2F38',
    textAlign: 'center',
    letterSpacing: -0.52,
  },
  button: {
    height: 50,
    minWidth: 88,
    paddingHorizontal: 16,
    borderRadius: 18,
    backgroundColor: green[300],
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonLabel: {
    ...typography.primary.body1B,
    color: '#FFFFFF',
    textAlign: 'center',
    letterSpacing: -0.32,
  },
});
