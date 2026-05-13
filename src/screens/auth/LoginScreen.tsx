import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { loginWithKakao } from '../../api/auth';
import LoginToast from '../../components/LoginToast';
import { primitiveColors } from '../../lib/token/primitive/colors';
import { typography } from '../../lib/token/primitive/typography';
import { semanticColors } from '../../lib/token/semantic/colors';

const { brown } = primitiveColors;

type ToastType = 'sessionExpired' | 'loginFailed';

export default function LoginScreen() {
  const router = useRouter();
  const { toast } = useLocalSearchParams<{ toast?: string }>();
  const [activeToast, setActiveToast] = useState<ToastType | null>(null);

  useEffect(() => {
    if (toast === 'session') setActiveToast('sessionExpired');
  }, [toast]);

  const handleKakaoLogin = async () => {
    try {
      await loginWithKakao();
      router.replace('/permissions');
    } catch {
      setActiveToast('loginFailed');
    }
  };

  return (
    <View style={styles.root}>
      <View style={styles.topSection}>
        <Image source={require('../../../assets/logo-detoxmate-black.png')} />
        <Text style={styles.tagline}>매일 디지털 디톡스를 하며{'\n'}친구들과 함께 성장해요</Text>
      </View>

      <View style={styles.imageSection}>
        <Image
          source={require('../../../assets/turtle-hi.png')}
          style={styles.turtleImage}
          resizeMode="contain"
        />
      </View>

      <View style={styles.toastArea}>
        {activeToast && (
          <LoginToast type={activeToast} visible={true} onHide={() => setActiveToast(null)} />
        )}
      </View>

      <View style={styles.buttonSection}>
        <TouchableOpacity
          style={styles.kakaoButton}
          onPress={handleKakaoLogin}
          activeOpacity={0.85}
        >
          <View style={styles.buttonInner}>
            <Image source={require('../../../assets/logo-kakao-login.png')} />
            <Text style={styles.kakaoText}>카카오로 시작하기</Text>
            <View style={styles.iconPlaceholder} />
          </View>
        </TouchableOpacity>

        <View style={styles.buttonGap} />

        <TouchableOpacity style={styles.appleButton} activeOpacity={0.85}>
          <View style={styles.buttonInner}>
            <Image source={require('../../../assets/logo-apple-login.png')} />
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
  tagline: {
    ...typography.primary.body1R,
    color: semanticColors.text.secondary,
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
  toastArea: {
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
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
  buttonInner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  iconPlaceholder: {
    width: 24,
  },
  kakaoText: {
    flex: 1,
    ...typography.primary.body1B,
    color: '#191600',
    textAlign: 'center',
  },
  appleText: {
    flex: 1,
    ...typography.primary.body1B,
    color: '#FFFFFF',
    textAlign: 'center',
  },
});
