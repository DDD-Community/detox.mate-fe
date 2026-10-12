import { useEffect, useRef, useState } from 'react';
import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { overlay } from 'overlay-kit';
import { logError, normalizeError } from '@/api/errors';
import { TERMS_ACCEPTED_KEY } from './authStorageKeys';
import { TermsAgreementSheet } from './TermsAgreementSheet';

export function useTermsConsent({ onFailure }: { onFailure: () => void }) {
  const [pending, setPending] = useState(false);
  const busy = useRef(false);
  const active = useRef(true);
  const cancel = useRef<(() => void) | null>(null);

  useEffect(() => {
    active.current = true;
    return () => {
      active.current = false;
      cancel.current?.();
    };
  }, []);

  const requestConsent = async () => {
    if (busy.current) return false;
    busy.current = true;
    setPending(true);
    try {
      const accepted = await SecureStore.getItemAsync(TERMS_ACCEPTED_KEY);
      if (!active.current) return false;
      if (accepted === 'true') return true;

      const agreed = await new Promise<boolean>((resolve) => {
        let result = false;
        let closing = false;
        const overlayId = overlay.open(({ isOpen, close, unmount }) => {
          const dismiss = () => {
            unmount();
            resolve(result);
          };
          const finish = (accepted: boolean) => {
            if (closing) return;
            closing = true;
            result = accepted;
            close();
            // iOS에서는 시트가 완전히 닫힌 뒤 네이티브 소셜 로그인을 시작한다.
            if (Platform.OS !== 'ios') dismiss();
          };
          return (
            <TermsAgreementSheet
              visible={isOpen}
              onConfirm={() => finish(true)}
              onClose={() => finish(false)}
              onDismiss={dismiss}
            />
          );
        });
        cancel.current = () => {
          overlay.unmount(overlayId);
          resolve(false);
        };
      });
      cancel.current = null;
      if (!agreed || !active.current) return false;
      await SecureStore.setItemAsync(TERMS_ACCEPTED_KEY, 'true');
      return active.current;
    } catch (error) {
      logError(normalizeError(error), { scope: 'auth.login', operation: 'requestTermsConsent' });
      if (active.current) onFailure();
      return false;
    } finally {
      busy.current = false;
      if (active.current) setPending(false);
    }
  };

  return { requestConsent, pending };
}
