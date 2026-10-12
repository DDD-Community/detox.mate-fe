import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button, Checkbox, LoggingButton, LoggingPage } from '@/components';
import { fontFamily, primitiveColors } from '@/lib/token';
import { trackButtonClick } from '@/lib/analytics';
import { TermsAgreementRow } from './TermsAgreementRow';
import { useTermsAgreement } from './useTermsAgreement';

export function TermsAgreementSheet({
  visible,
  onConfirm,
  onClose,
  onDismiss,
}: {
  visible: boolean;
  onConfirm: () => void;
  onClose: () => void;
  onDismiss: () => void;
}) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
      onDismiss={onDismiss}
    >
      <TermsContent onConfirm={onConfirm} onClose={onClose} />
    </Modal>
  );
}
function TermsContent({ onConfirm, onClose }: { onConfirm: () => void; onClose: () => void }) {
  const agreement = useTermsAgreement();
  const insets = useSafeAreaInsets();
  return (
    <LoggingPage eventName="Terms Agreement Viewed" properties={{ pageName: 'TermsAgreement' }}>
      <View style={styles.root}>
        <Pressable
          style={StyleSheet.absoluteFill}
          onPress={onClose}
          accessibilityLabel="약관 닫기"
        />
        <View style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, 34) + 26 }]}>
          <View style={styles.handle} />
          <View style={styles.heading}>
            <Text style={styles.title}>서비스 이용 필수 동의</Text>
            <Text style={styles.subtitle}>디톡스메이트 이용을 위해 꼭 필요해요.</Text>
          </View>
          <View style={styles.list}>
            <View style={styles.all}>
              <Checkbox
                checked={agreement.allAgreed}
                label="전체 동의"
                labelStyle={styles.allLabel}
                onChange={() => {
                  trackButtonClick(
                    'Terms Agreement Agree All Clicked',
                    'TermsAgreement',
                    '전체 동의'
                  );
                  agreement.handleAllAgree();
                }}
              />
            </View>
            <TermsAgreementRow
              checked={agreement.privacyAgreed}
              label="개인정보처리방침 동의"
              toggleEventName="Terms Agreement Privacy Agree Toggle Clicked"
              toggleButtonName="개인정보처리방침 동의 토글"
              openEventName="Terms Agreement Privacy Open Clicked"
              openButtonName="개인정보처리방침 열기"
              onChange={agreement.setPrivacyAgreed}
              onOpen={() => agreement.openAgreementUrl('privacy')}
            />
            <TermsAgreementRow
              checked={agreement.termsAgreed}
              label="서비스 이용 약관 동의"
              toggleEventName="Terms Agreement Terms Agree Toggle Clicked"
              toggleButtonName="서비스 이용 약관 동의 토글"
              openEventName="Terms Agreement Terms Open Clicked"
              openButtonName="서비스 이용 약관 열기"
              onChange={agreement.setTermsAgreed}
              onOpen={() => agreement.openAgreementUrl('terms')}
            />
          </View>
          <LoggingButton
            eventName="Terms Agreement Confirm Clicked"
            properties={{ pageName: 'TermsAgreement', buttonName: '동의하고 넘어가기' }}
          >
            <Button
              label="동의하고 넘어가기"
              disabled={!agreement.allAgreed}
              onPress={onConfirm}
              style={styles.button}
            />
          </LoggingButton>
        </View>
      </View>
    </LoggingPage>
  );
}
const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: 'rgba(0,0,0,0.3)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 5,
    gap: 24,
  },
  handle: {
    width: 52,
    height: 5,
    borderRadius: 100,
    backgroundColor: primitiveColors.gray[100],
    alignSelf: 'center',
    marginBottom: 6,
  },
  heading: { gap: 8 },
  title: {
    fontFamily: fontFamily.primary.bold,
    fontSize: 20,
    lineHeight: 28,
    color: primitiveColors.gray[900],
  },
  subtitle: {
    fontFamily: fontFamily.primary.medium,
    fontSize: 15,
    lineHeight: 22,
    color: primitiveColors.gray[400],
  },
  list: { gap: 16 },
  allLabel: { fontFamily: fontFamily.primary.medium, fontSize: 16, lineHeight: 24 },
  all: {
    backgroundColor: primitiveColors.gray[50],
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  button: { width: '100%', borderRadius: 999 },
});
