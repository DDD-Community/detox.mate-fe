import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { Icon } from '@/components';
import { primitiveColors, spacing, typography } from '@/lib/token';
import { TermsAgreementRow } from './TermsAgreementRow';
import { useTermsAgreement } from './useTermsAgreement';

const { green, gray } = primitiveColors;

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

          <TouchableOpacity style={styles.allAgreeRow} onPress={handleAllAgree} activeOpacity={0.7}>
            <Icon name="check" size={20} color={allAgreed ? green[500] : gray[400]} />
            <Text style={styles.allAgreeText}>전체 동의</Text>
          </TouchableOpacity>

          <View style={styles.gap16} />

          <TermsAgreementRow
            checked={privacyAgreed}
            label="개인정보처리 방침 동의"
            onChange={setPrivacyAgreed}
            onOpen={() => openAgreementUrl('privacy')}
          />

          <View style={styles.gap12} />

          <TermsAgreementRow
            checked={termsAgreed}
            label="서비스 이용 약관 동의"
            onChange={setTermsAgreed}
            onOpen={() => openAgreementUrl('terms')}
          />

          <View style={styles.gap32} />

          <TouchableOpacity
            style={[styles.confirmButton, allAgreed && styles.confirmButtonEnabled]}
            onPress={confirmAgreements}
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
    color: gray[900],
    marginBottom: 12,
  },
  subtitle: {
    ...typography.primary.body2R,
    color: gray[400],
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
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  allAgreeText: {
    ...typography.primary.body1M,
    color: gray[900],
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
