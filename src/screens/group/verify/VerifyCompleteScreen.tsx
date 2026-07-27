import { router, useLocalSearchParams } from 'expo-router';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';

import ONBOARDING_CHECK_IMAGE from '@assets/onboarding-check.png';

import { LoggingButton, LoggingPage } from '@/components';
import { getVerifyExitRoute, goBackOrReplace } from '@/lib/navigation';
import { primitiveColors, typography } from '@/lib/token';
import { VerifyBottomSheet } from './VerifyBottomSheet';
import type { VerifyMode, VerifyRoot } from './verifyFlowParams';

const { green } = primitiveColors;

export default function VerifyCompleteScreen() {
  const { mode, verifyRoot } = useLocalSearchParams<{
    mode?: VerifyMode;
    verifyRoot?: VerifyRoot;
  }>();

  const handleGoHome = () => {
    router.replace('/(feed)/home');
  };

  return (
    <LoggingPage eventName="Verify Complete Viewed" properties={{ pageName: 'VerifyComplete' }}>
      <VerifyBottomSheet onDismiss={() => goBackOrReplace(getVerifyExitRoute(verifyRoot))}>
        <View style={styles.content}>
          <View style={styles.heading}>
            <Image source={ONBOARDING_CHECK_IMAGE} style={styles.checkIcon} resizeMode="contain" />
            <Text style={styles.title}>{'인증 완료 !\n오늘도 잘 해냈어요 !'}</Text>
          </View>

          <LoggingButton
            eventName="Verify Complete Go Home Clicked"
            properties={{
              pageName: 'VerifyComplete',
              buttonName: '홈으로 돌아가기',
              verify_mode: mode ?? 'verify',
            }}
          >
            <Pressable style={styles.button} onPress={handleGoHome}>
              <Text style={styles.buttonLabel}>홈으로 돌아가기</Text>
            </Pressable>
          </LoggingButton>
        </View>
      </VerifyBottomSheet>
    </LoggingPage>
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
