import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { Icon, LoggingButton, LoggingPage } from '@/components';
import { primitiveColors, radius, spacing, typography } from '@/lib/token';
import { TermsAgreementRow } from './TermsAgreementRow';
import { useTermsAgreement } from './useTermsAgreement';

const { brown, gray } = primitiveColors;

export default function TermsAgreementScreen() {
  const {
    allAgreed,
    confirmAgreements,
    handleAllAgree,
    openAgreementUrl,
    privacyAgreed,
    setPrivacyAgreed,
    setTermsAgreed,
    termsAgreed,
  } = useTermsAgreement();

  return (
    <LoggingPage eventName="Terms Agreement Viewed" properties={{ pageName: 'TermsAgreement' }}>
      <View style={styles.root}>
        <View style={styles.backdrop} />

        <View style={styles.sheet}>
          <View style={styles.handle} />

          <View style={styles.content}>
            <Text style={styles.title}>아래 약관에{'\n'}동의하시겠습니까?</Text>
            <Text style={styles.subtitle}>
              회원가입 및 서비스 제공을 위해 개인정보를{'\n'}수집·이용합니다.
            </Text>

            <View style={styles.gap28} />

            <LoggingButton
              eventName="Terms Agreement Agree All Clicked"
              properties={{ pageName: 'TermsAgreement', buttonName: '전체 동의' }}
            >
              <TouchableOpacity
                style={styles.allAgreeRow}
                onPress={handleAllAgree}
                activeOpacity={0.7}
              >
                <Icon name="check" size={18} color={gray[900]} />
                <Text style={styles.allAgreeText}>전체 동의</Text>
              </TouchableOpacity>
            </LoggingButton>

            <View style={styles.gap16} />

            <TermsAgreementRow
              checked={privacyAgreed}
              label="개인정보처리 방침 동의"
              toggleEventName="Terms Agreement Privacy Agree Toggle Clicked"
              toggleButtonName="개인정보처리 방침 동의 토글"
              openEventName="Terms Agreement Privacy Open Clicked"
              openButtonName="개인정보처리 방침 열기"
              onChange={setPrivacyAgreed}
              onOpen={() => openAgreementUrl('privacy')}
            />

            <View style={styles.gap12} />

            <TermsAgreementRow
              checked={termsAgreed}
              label="서비스 이용 약관 동의"
              toggleEventName="Terms Agreement Terms Agree Toggle Clicked"
              toggleButtonName="서비스 이용 약관 동의 토글"
              openEventName="Terms Agreement Terms Open Clicked"
              openButtonName="서비스 이용 약관 열기"
              onChange={setTermsAgreed}
              onOpen={() => openAgreementUrl('terms')}
            />

            <View style={styles.gap32} />

            <LoggingButton
              eventName="Terms Agreement Confirm Clicked"
              properties={{ pageName: 'TermsAgreement', buttonName: '확인' }}
            >
              <TouchableOpacity
                style={[styles.confirmButton, allAgreed && styles.confirmButtonEnabled]}
                onPress={confirmAgreements}
                disabled={!allAgreed}
                activeOpacity={0.85}
              >
                <Text style={styles.confirmText}>확인</Text>
              </TouchableOpacity>
            </LoggingButton>
          </View>
        </View>
      </View>
    </LoggingPage>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'flex-end',
  },
  backdrop: {
    flex: 1,
  },
  sheet: {
    marginHorizontal: spacing[8],
    marginBottom: 42,
    backgroundColor: brown[50],
    borderRadius: 24,
    paddingHorizontal: spacing[20],
    paddingBottom: spacing[20],
  },
  handle: {
    width: 52,
    height: 5,
    backgroundColor: gray[100],
    borderRadius: radius.full,
    alignSelf: 'center',
    marginTop: 5,
  },
  content: {
    paddingTop: spacing[24],
  },
  title: {
    ...typography.accent.h3,
    color: gray[900],
    letterSpacing: -0.52,
    marginBottom: spacing[12],
  },
  subtitle: {
    ...typography.primary.body2R,
    color: gray[400],
    letterSpacing: -0.28,
  },
  gap28: { height: 28 },
  gap16: { height: 16 },
  gap12: { height: 12 },
  gap32: { height: 32 },
  allAgreeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[8],
    backgroundColor: gray[50],
    borderRadius: radius[12],
    paddingVertical: 14,
    paddingHorizontal: spacing[12],
  },
  allAgreeText: {
    ...typography.accent.title2,
    color: gray[900],
  },
  confirmButton: {
    height: 50,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: brown[900],
    opacity: 0.3,
  },
  confirmButtonEnabled: {
    opacity: 1,
  },
  confirmText: {
    ...typography.primary.body1B,
    color: '#FFFFFF',
    letterSpacing: -0.32,
  },
});
