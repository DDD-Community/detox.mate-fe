import { useLocalSearchParams } from 'expo-router';
import { useEffect, useRef } from 'react';
import { Alert, Image, Pressable, StyleSheet, Text, View } from 'react-native';

import LOGO_APPLE_LOGIN from '@assets/logo-apple-login.png';
import LOGO_BLACK from '@assets/logo-black.png';
import LOGO_KAKAO_LOGIN from '@assets/logo-kakao-login.png';
import TURTLE_HI_IMAGE from '@assets/turtle-hi.png';

import { Icon, LoggingPage, Toast, useToastVisibility } from '@/components';
import { primitiveColors, typography } from '@/lib/token';
import { AppAccessPermissionGuideModal } from './AppAccessPermissionGuideModal';
import { AuthLoginButton } from './AuthLoginButton';
import { useAuthLogin } from './useAuthLogin';

const { brown, gray, system } = primitiveColors;
const LOGIN_FAILURE_MESSAGE = '로그인에 실패했어요. 잠시 후 다시 시도해 주세요.';
const SESSION_EXPIRED_MESSAGE = '로그인 세션이 만료되었습니다.';
const LOGIN_TOAST_BOTTOM_OFFSET = 204;
const TEST_LOGIN_TAP_WINDOW_MS = 5000;
const TEST_LOGIN_TAP_COUNT = 5;

export default function LoginScreen() {
  const { reason } = useLocalSearchParams<{ reason?: string }>();
  const loginToast = useToastVisibility();
  const testLoginGesture = useRef({ startedAt: 0, count: 0 });
  const {
    handleKakaoLogin,
    handleAppleLogin,
    handleTestLogin,
    handleConfirmPermissionGuide,
    pendingProvider,
    permissionGuideConfirming,
    permissionGuideVisible,
  } = useAuthLogin({
    onLoginFailure: () => loginToast.showWithMessage(LOGIN_FAILURE_MESSAGE),
  });
  const loginPending = Boolean(pendingProvider);
  const isSessionExpiredToast = loginToast.message === SESSION_EXPIRED_MESSAGE;

  const handleTurtlePress = () => {
    if (loginPending) return;

    const now = Date.now();
    const gesture = testLoginGesture.current;
    if (now - gesture.startedAt > TEST_LOGIN_TAP_WINDOW_MS) {
      gesture.startedAt = now;
      gesture.count = 0;
    }
    gesture.count += 1;
    if (gesture.count < TEST_LOGIN_TAP_COUNT) return;

    gesture.count = 0;
    gesture.startedAt = 0;
    Alert.alert('테스트 계정 로그인', '로그인할 계정을 선택하세요.', [
      { text: 'A 로그인', onPress: () => handleTestLogin('front-a') },
      { text: 'B 로그인', onPress: () => handleTestLogin('front-b') },
      { text: '취소', style: 'cancel' },
    ]);
  };

  useEffect(() => {
    if (reason === 'sessionExpired') {
      loginToast.showWithMessage(SESSION_EXPIRED_MESSAGE);
    }
  }, [reason]);

  return (
    <LoggingPage eventName="Login Viewed" properties={{ pageName: 'Login' }}>
      <View style={styles.root}>
        <Image source={LOGO_BLACK} style={styles.logoMark} resizeMode="contain" />
        <Text style={styles.tagline}>매일 디지털 디톡스를 하며{'\n'}친구들과 함께 성장해요</Text>
        <Pressable
          style={styles.turtleArea}
          onPress={handleTurtlePress}
          disabled={loginPending}
          accessibilityRole="button"
          accessibilityLabel="거북이"
        >
          <Image source={TURTLE_HI_IMAGE} style={styles.turtleImage} resizeMode="contain" />
        </Pressable>

        <View style={styles.buttonSection}>
          <AuthLoginButton
            variant="kakao"
            label="카카오로 시작하기"
            pendingLabel="카카오 로그인 중..."
            iconSource={LOGO_KAKAO_LOGIN}
            onPress={handleKakaoLogin}
            pending={pendingProvider === 'kakao'}
            disabled={loginPending}
          />

          <View style={styles.buttonGap} />

          <AuthLoginButton
            variant="apple"
            label="애플로 시작하기"
            pendingLabel="애플 로그인 중..."
            iconSource={LOGO_APPLE_LOGIN}
            onPress={handleAppleLogin}
            pending={pendingProvider === 'apple'}
            disabled={loginPending}
          />
        </View>

        <Toast
          visible={loginToast.visible}
          message={loginToast.message}
          bottomOffset={LOGIN_TOAST_BOTTOM_OFFSET}
          icon={
            <Icon
              name={isSessionExpiredToast ? 'info' : 'warningCircle'}
              size={16}
              weight="fill"
              color={isSessionExpiredToast ? '#FFFFFF' : system.red.opacity100}
            />
          }
        />

        <AppAccessPermissionGuideModal
          visible={permissionGuideVisible}
          onConfirm={handleConfirmPermissionGuide}
          confirming={permissionGuideConfirming}
        />
      </View>
    </LoggingPage>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: brown[50],
  },
  logoMark: {
    position: 'absolute',
    top: 151,
    alignSelf: 'center',
    width: 26,
    height: 25,
  },
  tagline: {
    position: 'absolute',
    top: 196,
    left: 0,
    right: 0,
    ...typography.accent.body1,
    color: gray[800],
    letterSpacing: -0.36,
    textAlign: 'center',
  },
  turtleArea: {
    position: 'absolute',
    top: 316,
    left: 100,
    width: 175,
    height: 231,
  },
  turtleImage: {
    width: '100%',
    height: '100%',
  },
  buttonSection: {
    position: 'absolute',
    left: 16,
    right: 16,
    bottom: 60,
  },
  buttonGap: {
    height: 12,
  },
});
