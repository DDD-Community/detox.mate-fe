import React, { useEffect, useRef, useState } from 'react';
import {
  AppState,
  Linking,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { loginWithKakao } from '../auth/kakaoLogin';
import { primitiveColors } from '../src/lib/token/primitive/colors';
import { typography } from '../src/lib/token/primitive/typography';
import { semanticColors } from '../src/lib/token/semantic/colors';

const { green, gray } = primitiveColors;

export default function AgreeScreen() {
  const router = useRouter();
  const [privacyAgreed, setPrivacyAgreed] = useState(false);
  const [termsAgreed, setTermsAgreed] = useState(false);

  // ref로 추적 — AppState 콜백은 한 번만 등록되므로 useState 클로저가 stale해짐.
  // ref는 항상 최신값을 참조하므로 deps 없이 안전하게 사용 가능.
  const privacyLinkOpenedRef = useRef(false);
  const termsLinkOpenedRef = useRef(false);

  // 앱이 background → active로 전환될 때, 직전에 해당 URL을 열었으면 자동 체크.
  // 정확히 www.a.com을 방문했는지는 브라우저에서 감지 불가하나,
  // "링크 탭 후 앱 복귀"를 충분한 의사 표현으로 간주하는 UX 패턴.
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextState) => {
      if (nextState === 'active') {
        if (privacyLinkOpenedRef.current) {
          setPrivacyAgreed(true);
          privacyLinkOpenedRef.current = false;
        }
        if (termsLinkOpenedRef.current) {
          setTermsAgreed(true);
          termsLinkOpenedRef.current = false;
        }
      }
    });
    return () => subscription.remove();
  }, []);

  const allAgreed = privacyAgreed && termsAgreed;

  const handleAllAgree = () => {
    const next = !allAgreed;
    setPrivacyAgreed(next);
    setTermsAgreed(next);
  };

  const openPrivacyUrl = () => {
    privacyLinkOpenedRef.current = true;
    Linking.openURL('https://www.a.com');
  };

  const openTermsUrl = () => {
    termsLinkOpenedRef.current = true;
    Linking.openURL('https://www.b.com');
  };

  return (
    <View style={styles.root}>
      {/* 바텀시트 뒤 배경을 연출하는 회색 영역 */}
      <View style={styles.backdrop} />

      <View style={styles.sheet}>
        <View style={styles.handle} />

        <View style={styles.content}>
          <Text style={styles.title}>아래 약관에{'\n'}동의하시겠습니까?</Text>
          <Text style={styles.subtitle}>
            회원가입 및 서비스 제공을 위해 개인정보를{'\n'}수집·이용합니다.
          </Text>

          <View style={styles.gap28} />

          {/* 전체 동의 행 */}
          <TouchableOpacity
            style={styles.allAgreeRow}
            onPress={handleAllAgree}
            activeOpacity={0.7}
          >
            <Text style={[styles.allCheckmark, allAgreed && styles.allCheckmarkActive]}>✓</Text>
            <Text style={styles.allAgreeText}>전체 동의</Text>
          </TouchableOpacity>

          <View style={styles.gap16} />

          {/* 개인정보처리 방침 동의
              - 체크박스만 단독 TouchableOpacity → 토글
              - 텍스트 + 화살표는 묶어서 TouchableOpacity → URL 이동 & 자동 체크 */}
          <View style={styles.agreeRow}>
            <TouchableOpacity
              style={[styles.checkbox, privacyAgreed && styles.checkboxChecked]}
              onPress={() => setPrivacyAgreed(v => !v)}
              activeOpacity={0.7}
            >
              {privacyAgreed && <Text style={styles.checkIcon}>✓</Text>}
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.agreeRowRight}
              onPress={openPrivacyUrl}
              activeOpacity={0.7}
            >
              <Text style={styles.agreeText}>개인정보처리 방침 동의</Text>
              <Text style={styles.chevron}>›</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.gap12} />

          {/* 서비스 이용 약관 동의 — 구조 동일 */}
          <View style={styles.agreeRow}>
            <TouchableOpacity
              style={[styles.checkbox, termsAgreed && styles.checkboxChecked]}
              onPress={() => setTermsAgreed(v => !v)}
              activeOpacity={0.7}
            >
              {termsAgreed && <Text style={styles.checkIcon}>✓</Text>}
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.agreeRowRight}
              onPress={openTermsUrl}
              activeOpacity={0.7}
            >
              <Text style={styles.agreeText}>서비스 이용 약관 동의</Text>
              <Text style={styles.chevron}>›</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.gap32} />

          {/* 확인 버튼: 약관 동의 완료 후 OAuth 실행 */}
          <TouchableOpacity
            style={[styles.confirmButton, allAgreed && styles.confirmButtonEnabled]}
            onPress={async () => {
              await loginWithKakao();
              router.replace('/home');
            }}
            disabled={!allAgreed}
            activeOpacity={0.85}
          >
            <Text style={styles.confirmText}>확인</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: gray[100],
    justifyContent: 'flex-end',
  },
  backdrop: {
    flex: 1,
  },
  sheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 34,
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: gray[200],
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 12,
  },
  content: {
    paddingHorizontal: 24,
    paddingTop: 28,
  },
  title: {
    ...typography.primary.h2,
    color: semanticColors.text.primary,
    marginBottom: 12,
  },
  subtitle: {
    ...typography.primary.body2R,
    color: semanticColors.text.tertiary,
  },
  gap28: { height: 28 },
  gap16: { height: 16 },
  gap12: { height: 12 },
  gap32: { height: 32 },
  allAgreeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: gray[50],
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  allCheckmark: {
    fontSize: 16,
    fontFamily: 'NanumSquareRoundB',
    color: gray[400],
    lineHeight: 20,
  },
  allCheckmarkActive: {
    color: green[500],
  },
  allAgreeText: {
    ...typography.primary.body1M,
    color: semanticColors.text.primary,
  },
  agreeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: gray[200],
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: green[500],
    borderColor: green[500],
  },
  checkIcon: {
    color: '#FFFFFF',
    fontSize: 12,
    fontFamily: 'NanumSquareRoundEB',
    lineHeight: 16,
    includeFontPadding: false,
  },
  // 텍스트 + 화살표를 묶은 탭 영역 — URL 이동 & 자동 체크 트리거
  agreeRowRight: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  agreeText: {
    flex: 1,
    ...typography.primary.body2M,
    color: semanticColors.text.primary,
  },
  chevron: {
    fontSize: 22,
    color: gray[400],
    lineHeight: 26,
    paddingLeft: 8,
  },
  confirmButton: {
    borderRadius: 100,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: gray[200],
  },
  confirmButtonEnabled: {
    backgroundColor: gray[800],
  },
  confirmText: {
    ...typography.primary.body1B,
    color: '#FFFFFF',
  },
});
