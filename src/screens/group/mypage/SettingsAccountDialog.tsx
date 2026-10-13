import { isCancel } from 'axios';
import { router } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import { useRef, useState } from 'react';

import { clearAuthSession, logout } from '@/api/auth';
import { getAuthenticatedRequestSignal } from '@/api/client';
import { getUser } from '@/api/generated/user/user';
import { getUserErrorMessage, logError, normalizeError } from '@/api/errors';
import { clearLocalUserData } from '@/lib/clearLocalUserData';
import { clearStoredDevicePushToken, unregisterDevicePushToken } from '@/lib/fcmToken';
import { TERMS_ACCEPTED_KEY } from '@/screens/auth/authStorageKeys';
import { useNetworkErrorToastStore } from '@/stores/networkErrorToastStore';
import { LogoutConfirmAlert } from './LogoutConfirmAlert';
import { WithdrawConfirmAlert } from './WithdrawConfirmAlert';

export function SettingsAccountDialog({
  action,
  visible,
  onClose,
  onDismiss,
}: {
  action: 'logout' | 'withdraw';
  visible: boolean;
  onClose: () => void;
  onDismiss: () => void;
}) {
  const [pending, setPending] = useState(false);
  const busy = useRef(false);
  const session = useRef(getAuthenticatedRequestSignal()).current;

  const confirm = async () => {
    if (busy.current) return;
    if (session.aborted) {
      onClose();
      return;
    }
    busy.current = true;
    setPending(true);
    let accountDeleted = false;
    try {
      if (action === 'withdraw') {
        await getUser().withdraw();
        if (session.aborted) {
          onClose();
          return;
        }
        accountDeleted = true;
      } else {
        try {
          await unregisterDevicePushToken();
        } catch (failure) {
          if (!isCancel(failure)) {
            logError(normalizeError(failure), {
              scope: 'notification.push',
              operation: 'unregisterBeforeLogout',
            });
          }
        }
      }

      if (action === 'withdraw') {
        // 사용자 ID가 필요한 기기 데이터부터 지운 뒤 인증 정보를 정리한다.
        await clearLocalUserData();
        const results = await Promise.allSettled([
          clearAuthSession(),
          SecureStore.deleteItemAsync('isNewUser'),
          SecureStore.deleteItemAsync(TERMS_ACCEPTED_KEY),
          clearStoredDevicePushToken(),
        ]);
        for (const result of results) {
          if (result.status === 'rejected') {
            logError(normalizeError(result.reason), {
              scope: 'api',
              operation: 'withdraw.cleanup',
            });
          }
        }
      } else {
        if (session.aborted) {
          onClose();
          return;
        }
        await logout();
      }
      onClose();
      if (session === getAuthenticatedRequestSignal()) {
        router.replace(action === 'withdraw' ? '/' : '/(auth)/login');
      }
    } catch (failure) {
      if (isCancel(failure)) return;
      const error = normalizeError(failure);
      logError(error, { scope: 'api', operation: action });
      if (!['network', 'timeout', 'server'].includes(error.type)) {
        useNetworkErrorToastStore.getState().showMessage(getUserErrorMessage(error));
      }
      if (accountDeleted || action === 'logout') onClose();
    } finally {
      busy.current = false;
      setPending(false);
    }
  };

  const Dialog = action === 'withdraw' ? WithdrawConfirmAlert : LogoutConfirmAlert;
  return (
    <Dialog
      visible={visible}
      onClose={() => {
        if (!busy.current) onClose();
      }}
      onDismiss={onDismiss}
      onConfirm={confirm}
      loading={pending}
    />
  );
}
