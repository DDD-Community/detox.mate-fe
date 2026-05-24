import { Image, StyleSheet, Text, View } from 'react-native';

import LOGO_APPLE_LOGIN from '@assets/logo-apple-login.png';
import LOGO_DETOXMATE_BLACK from '@assets/logo-detoxmate-black.png';
import LOGO_KAKAO_LOGIN from '@assets/logo-kakao-login.png';
import TURTLE_HI_IMAGE from '@assets/turtle-hi.png';

import { primitiveColors, typography } from '@/lib/token';
import { AuthLoginButton } from './AuthLoginButton';
import { useAuthLogin } from './useAuthLogin';

const { brown, gray } = primitiveColors;

export default function LoginScreen() {
  const { handleKakaoLogin, handleTestLogin, pendingProvider } = useAuthLogin();
  const loginPending = Boolean(pendingProvider);

  return (
    <View style={styles.root}>
      <View style={styles.topSection}>
        <Image source={LOGO_DETOXMATE_BLACK} />
        <Text style={styles.tagline}>매일 디지털 디톡스를 하며{'\n'}친구들과 함께 성장해요</Text>
      </View>

      <View style={styles.imageSection}>
        <Image source={TURTLE_HI_IMAGE} style={styles.turtleImage} resizeMode="contain" />
      </View>

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
          variant="test"
          label="새 테스트 계정으로 시작하기"
          pendingLabel="테스트 계정 생성 중..."
          onPress={handleTestLogin}
          pending={pendingProvider === 'test'}
          disabled={loginPending}
        />

        <View style={styles.buttonGap} />

        <AuthLoginButton
          variant="apple"
          label="애플로 시작하기"
          iconSource={LOGO_APPLE_LOGIN}
          disabled={loginPending}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: brown[50],
  },
  topSection: {
    alignItems: 'center',
    paddingTop: 150,
    gap: 10,
  },
  tagline: {
    ...typography.primary.body1R,
    color: gray[600],
    textAlign: 'center',
  },
  imageSection: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  turtleImage: {
    width: 260,
    height: 280,
  },
  buttonSection: {
    paddingHorizontal: 24,
    paddingBottom: 48,
  },
  buttonGap: {
    height: 12,
  },
});
