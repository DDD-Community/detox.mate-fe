import * as SecureStore from 'expo-secure-store';
import { useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { AppState, Linking } from 'react-native';

type AgreementKey = 'privacy' | 'terms';

export const agreementUrls = {
  privacy: 'https://happysisyphe.notion.site/342ad7a38ce580e1ba8ac09e06c96dca?pvs=73',
  terms: 'https://happysisyphe.notion.site/342ad7a38ce58022b466ffec4ca39482',
} as const satisfies Record<AgreementKey, string>;

export function useTermsAgreement() {
  const router = useRouter();
  const [privacyAgreed, setPrivacyAgreed] = useState(false);
  const [termsAgreed, setTermsAgreed] = useState(false);

  // AppState 콜백은 mount 시 한 번만 등록되므로 useState 대신 ref로 추적 (stale closure 방지)
  const openedAgreementRef = useRef<AgreementKey | null>(null);

  // 브라우저 방문 여부는 감지 불가 — "링크 탭 후 앱 복귀"를 동의 의사 표현으로 간주
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextState) => {
      if (nextState !== 'active') return;

      if (openedAgreementRef.current === 'privacy') {
        setPrivacyAgreed(true);
      }

      if (openedAgreementRef.current === 'terms') {
        setTermsAgreed(true);
      }

      openedAgreementRef.current = null;
    });

    return () => subscription.remove();
  }, []);

  const allAgreed = privacyAgreed && termsAgreed;

  const handleAllAgree = () => {
    const next = !allAgreed;
    setPrivacyAgreed(next);
    setTermsAgreed(next);
  };

  const openAgreementUrl = (agreement: AgreementKey) => {
    openedAgreementRef.current = agreement;
    Linking.openURL(agreementUrls[agreement]);
  };

  const confirmAgreements = async () => {
    await SecureStore.setItemAsync('isNewUser', 'true');
    router.replace('/login');
  };

  return {
    allAgreed,
    confirmAgreements,
    handleAllAgree,
    openAgreementUrl,
    privacyAgreed,
    setPrivacyAgreed,
    setTermsAgreed,
    termsAgreed,
  };
}
