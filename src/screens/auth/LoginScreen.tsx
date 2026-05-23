import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { loginWithKakao, loginWithNewTestUser } from '../../api/auth';
import { registerDevicePushToken } from '../../lib/fcmToken';
import { primitiveColors } from '../../lib/token/primitive/colors';
import { typography } from '../../lib/token/primitive/typography';

const { brown, gray } = primitiveColors;
type LoginProvider = 'kakao' | 'test';

export default function LoginScreen() {
  const router = useRouter();
  const [pendingProvider, setPendingProvider] = useState<LoginProvider | null>(null);

  const completeLogin = async (provider: LoginProvider, login: () => Promise<unknown>) => {
    if (pendingProvider) return;

    setPendingProvider(provider);
    try {
      await login();
      try {
        await registerDevicePushToken();
      } catch {
        // 토큰 등록 실패는 로그인 흐름을 막지 않음
      }
      router.replace('/(group)/home');
    } catch {
      Alert.alert('로그인 실패', '로그인을 처리하지 못했어요. 잠시 후 다시 시도해주세요.');
    } finally {
      setPendingProvider(null);
    }
  };

  const handleKakaoLogin = () => {
    completeLogin('kakao', loginWithKakao);
  };

  const handleTestLogin = () => {
    completeLogin('test', loginWithNewTestUser);
  };

  return (
    <View style={styles.root}>
      <View style={styles.topSection}>
        <Image source={require('../../../assets/logo-detoxmate-black.png')}></Image>
        <Text style={styles.tagline}>매일 디지털 디톡스를 하며{'\n'}친구들과 함께 성장해요</Text>
      </View>

      <View style={styles.imageSection}>
        <Image
          source={require('../../../assets/turtle-hi.png')}
          style={styles.turtleImage}
          resizeMode="contain"
        />
      </View>

      <View style={styles.buttonSection}>
        <TouchableOpacity
          style={styles.kakaoButton}
          onPress={handleKakaoLogin}
          disabled={!!pendingProvider}
          activeOpacity={0.85}
        >
          <View style={styles.buttonInner}>
            <Image source={require('../../../assets/logo-kakao-login.png')}></Image>
            <Text style={styles.kakaoText}>
              {pendingProvider === 'kakao' ? '카카오 로그인 중...' : '카카오로 시작하기'}
            </Text>
            <View style={styles.iconPlaceholder} />
          </View>
        </TouchableOpacity>

        <View style={styles.buttonGap} />

        <TouchableOpacity
          style={[styles.testButton, pendingProvider && styles.testButtonDisabled]}
          onPress={handleTestLogin}
          disabled={!!pendingProvider}
          activeOpacity={0.85}
        >
          <Text style={styles.testText}>
            {pendingProvider === 'test' ? '테스트 계정 생성 중...' : '새 테스트 계정으로 시작하기'}
          </Text>
        </TouchableOpacity>

        <View style={styles.buttonGap} />

        <TouchableOpacity
          style={styles.appleButton}
          disabled={!!pendingProvider}
          activeOpacity={0.85}
        >
          <View style={styles.buttonInner}>
            <Image source={require('../../../assets/logo-apple-login.png')}></Image>
            <Text style={styles.appleText}>애플로 시작하기</Text>
            <View style={styles.iconPlaceholder} />
          </View>
        </TouchableOpacity>
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
  asterisk: {
    fontSize: 22,
    color: gray[700],
    fontFamily: 'NanumSquareRoundEB',
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
  kakaoButton: {
    backgroundColor: '#FEE500',
    borderRadius: 18,
    paddingVertical: 16,
  },
  appleButton: {
    backgroundColor: '#000000',
    borderRadius: 18,
    paddingVertical: 16,
  },
  testButton: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderColor: gray[200],
    borderRadius: 18,
    borderWidth: 1,
    paddingVertical: 16,
  },
  testButtonDisabled: {
    opacity: 0.6,
  },
  buttonInner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  iconPlaceholder: {
    width: 24,
  },
  kakaoIcon: {
    width: 24,
    fontSize: 16,
    textAlign: 'center',
  },
  kakaoText: {
    flex: 1,
    ...typography.primary.body1B,
    color: '#191600',
    textAlign: 'center',
  },
  appleIcon: {
    width: 24,
    fontSize: 18,
    color: '#FFFFFF',
    textAlign: 'center',
  },
  appleText: {
    flex: 1,
    ...typography.primary.body1B,
    color: '#FFFFFF',
    textAlign: 'center',
  },
  testText: {
    ...typography.primary.body1B,
    color: gray[800],
    textAlign: 'center',
  },
});
