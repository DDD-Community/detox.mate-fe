import { useLocalSearchParams } from 'expo-router';
import { useEffect, useRef } from 'react';
import { Image, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import LOGO_APPLE_LOGIN from '@assets/logo-apple-login.png';
import LOGO_KAKAO_LOGIN from '@assets/logo-kakao-login.png';
import { LoggingPage, Toast, useToastVisibility } from '@/components';
import { fontFamily, primitiveColors } from '@/lib/token';
import { OnboardingLayout } from '../onboarding/OnboardingLayout';
import { AuthLoginButton } from './AuthLoginButton';
import { TestLoginTrigger } from './TestLoginTrigger';
import { TermsAgreementSheet } from './TermsAgreementSheet';
import { useAuthLogin } from './useAuthLogin';

export default function LoginScreen() {
  const { reason } = useLocalSearchParams<{ reason?: string }>();
  const toast = useToastVisibility();
  const auth = useAuthLogin({
    onLoginFailure: () => toast.showWithMessage('로그인에 실패했어요. 잠시 후 다시 시도해 주세요.'),
  });
  const pending = Boolean(auth.pendingProvider);
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const showSessionExpired = useRef(toast.showWithMessage);
  showSessionExpired.current = toast.showWithMessage;
  useEffect(() => {
    if (reason === 'sessionExpired') showSessionExpired.current('로그인 세션이 만료되었습니다.');
  }, [reason]);
  return (
    <LoggingPage eventName="Login Viewed" properties={{ pageName: 'Login' }}>
      <OnboardingLayout
        footer={
          <View style={styles.buttons}>
            <AuthLoginButton
              variant="kakao"
              label="카카오로 시작하기"
              pendingLabel="카카오 로그인 중..."
              iconSource={LOGO_KAKAO_LOGIN}
              onPress={auth.handleKakaoLogin}
              pending={auth.pendingProvider === 'kakao'}
              disabled={pending}
            />
            <AuthLoginButton
              variant="apple"
              label="애플로 시작하기"
              pendingLabel="애플 로그인 중..."
              iconSource={LOGO_APPLE_LOGIN}
              onPress={auth.handleAppleLogin}
              pending={auth.pendingProvider === 'apple'}
              disabled={pending}
            />
          </View>
        }
      >
        <View style={{ height: 593 - insets.top }}>
          <View style={[styles.hero, { top: 261 - insets.top, height: (width * 332) / 393 }]}>
            <TestLoginTrigger disabled={pending} onSelectAccount={auth.handleTestLogin}>
              <Image source={require('@assets/onboarding/login.png')} style={styles.image} />
            </TestLoginTrigger>
          </View>
          <View style={[styles.heading, { top: 173 - insets.top }]}>
            <Text style={styles.title}>스마트폰은 멀리, 우리는 가까이!</Text>
            <Text style={styles.subtitle}>
              디지털 디톡스도{'\n'}이제 친구와 함께, 재밌게 해봐요.
            </Text>
          </View>
        </View>
      </OnboardingLayout>
      <Toast visible={toast.visible} message={toast.message} bottomOffset={204} />
      <TermsAgreementSheet
        visible={auth.termsVisible}
        pending={pending}
        onConfirm={auth.confirmTerms}
        onClose={auth.closeTerms}
      />
    </LoggingPage>
  );
}
const styles = StyleSheet.create({
  heading: { position: 'absolute', left: 16, right: 16, gap: 32, alignItems: 'center' },
  title: {
    fontFamily: fontFamily.primary.bold,
    fontSize: 22,
    lineHeight: 30,
    color: primitiveColors.gray[900],
    textAlign: 'center',
  },
  subtitle: {
    fontFamily: fontFamily.primary.medium,
    fontSize: 14,
    lineHeight: 20,
    color: primitiveColors.gray[900],
    textAlign: 'center',
  },
  hero: { position: 'absolute', left: 0, right: 0 },
  image: { width: '100%', height: '100%' },
  buttons: { gap: 12, paddingBottom: 25 },
});
