import { useRouter } from 'expo-router';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { primitiveColors } from '../../src/lib/token/primitive/colors';
import { typography } from '../../src/lib/token/primitive/typography';
import { semanticColors } from '../../src/lib/token/semantic/colors';

const { brown, gray } = primitiveColors;

export default function LoginScreen() {
  const router = useRouter();

  const handleKakaoLogin = () => {
    router.replace('/terms-agreement');
  };

  return (
    <View style={styles.root}>
      <View style={styles.topSection}>
        <Image source={require('../../assets/logo-detoxmate-black.png')}></Image>
        <Text style={styles.tagline}>매일 디지털 디톡스를 하며{'\n'}친구들과 함께 성장해요</Text>
      </View>

      <View style={styles.imageSection}>
        <Image
          source={require('../../assets/turtle-hi.png')}
          style={styles.turtleImage}
          resizeMode="contain"
        />
      </View>

      <View style={styles.buttonSection}>
        <TouchableOpacity
          style={styles.kakaoButton}
          onPress={handleKakaoLogin}
          activeOpacity={0.85}
        >
          <View style={styles.buttonInner}>
            <Image source={require('../../assets/logo-kakao-login.png')}></Image>
            <Text style={styles.kakaoText}>카카오로 시작하기</Text>
            <View style={styles.iconPlaceholder} />
          </View>
        </TouchableOpacity>

        <View style={styles.buttonGap} />

        <TouchableOpacity style={styles.appleButton} activeOpacity={0.85}>
          <View style={styles.buttonInner}>
            <Image source={require('../../assets/logo-apple-login.png')}></Image>
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
});
