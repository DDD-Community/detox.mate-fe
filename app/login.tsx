import { useRouter } from 'expo-router';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { primitiveColors } from '../src/lib/token/primitive/colors';
import { typography } from '../src/lib/token/primitive/typography';
import { semanticColors } from '../src/lib/token/semantic/colors';

const { brown, gray } = primitiveColors;

export default function LoginScreen() {
  const router = useRouter();

  // OAuth는 약관 동의 확인 이후에 실행 — 여기서는 terms-agreement 화면으로 이동만 한다
  const handleKakaoLogin = () => {
    router.replace('/terms-agreement');
  };

  return (
    <View style={styles.root}>
      {/* ── 상단 텍스트 섹션 ─────────────────────────────────────────
          브랜드 마크(✳) + 앱 슬로건. 화면 상단 고정. */}
      <View style={styles.topSection}>
        <Image source={require('../assets/logo-detoxmate-black.png')}></Image>
        <Text style={styles.tagline}>매일 디지털 디톡스를 하며{'\n'}친구들과 함께 성장해요</Text>
      </View>

      {/* ── 캐릭터 이미지 섹션 ───────────────────────────────────────
          flex: 1 로 남은 공간을 차지하며 이미지를 수직 중앙에 배치. */}
      <View style={styles.imageSection}>
        <Image
          source={require('../assets/turtle-hi.png')}
          style={styles.turtleImage}
          resizeMode="contain"
        />
      </View>

      {/* ── 버튼 섹션 ────────────────────────────────────────────────
          두 버튼을 화면 하단에 고정. */}
      <View style={styles.buttonSection}>
        {/* 카카오로 시작하기: 카카오 브랜드 옐로우 + 다크 텍스트 */}
        <TouchableOpacity
          style={styles.kakaoButton}
          onPress={handleKakaoLogin}
          activeOpacity={0.85}
        >
          <View style={styles.buttonInner}>
            {/* 카카오 채팅 아이콘 자리 — 좌우 대칭을 위해 width 고정 */}
            <Image source={require('../assets/logo-kakao-login.png')}></Image>
            <Text style={styles.kakaoText}>카카오로 시작하기</Text>
            <View style={styles.iconPlaceholder} />
          </View>
        </TouchableOpacity>

        <View style={styles.buttonGap} />

        {/* 애플로 시작하기: 이벤트 없음 (디자인 요소로만 존재) */}
        <TouchableOpacity style={styles.appleButton} activeOpacity={0.85}>
          <View style={styles.buttonInner}>
            {/* iOS 시스템 폰트에 내장된 Apple 로고 유니코드 (U+F8FF) */}
            <Image source={require('../assets/logo-apple-login.png')}></Image>
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
    // 디자인 배경색: brown[50] = '#f9f8f4' (크림/아이보리 계열)
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
  // 아이콘과 placeholder를 양쪽에 두어 텍스트가 정확히 중앙에 오도록 함
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
