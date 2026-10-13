import { useQueryClient, useSuspenseQuery } from '@tanstack/react-query';
import { isCancel } from 'axios';
import * as Notifications from 'expo-notifications';
import { useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';

import { getAuthenticatedRequestSignal } from '@/api/client';
import { getUser } from '@/api/generated/user/user';
import { getUserErrorMessage, logError, normalizeError } from '@/api/errors';
import { getMyProfileQueryOptions } from '@/api/userQueries';
import { setAnalyticsUserProperties, trackEvent } from '@/lib/analytics';
import {
  ensureDevicePushTokenRegistered,
  registerDevicePushToken,
  unregisterDevicePushToken,
} from '@/lib/fcmToken';
import { useNetworkErrorToastStore } from '@/stores/networkErrorToastStore';

export function useSettingsPushNotifications(onPermissionRequired: () => void) {
  const queryClient = useQueryClient();
  const { pushNotificationEnabled } = useSuspenseQuery(getMyProfileQueryOptions()).data;
  const [systemGranted, setSystemGranted] = useState(false);
  const [pending, setPending] = useState(false);
  const busy = useRef(false);

  useEffect(() => {
    setAnalyticsUserProperties({ push_notification_enabled: pushNotificationEnabled });
  }, [pushNotificationEnabled]);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      const session = getAuthenticatedRequestSignal();
      const sync = async () => {
        try {
          const permission = await Notifications.getPermissionsAsync();
          if (!active || session.aborted) return;
          const granted = permission.status === 'granted';
          setSystemGranted(granted);
          const me = queryClient.getQueryData(getMyProfileQueryOptions().queryKey);
          if (granted && me?.pushNotificationEnabled && !busy.current) {
            await ensureDevicePushTokenRegistered();
          }
        } catch (failure) {
          if (isCancel(failure) || session.aborted) return;
          logError(normalizeError(failure), {
            scope: 'notification.push',
            operation: 'syncSettingsPermission',
          });
        }
      };
      void sync();
      const subscription = AppState.addEventListener('change', (state) => {
        if (state === 'active') void sync();
      });
      return () => {
        active = false;
        subscription.remove();
      };
    }, [queryClient])
  );

  const toggle = async (enabled: boolean) => {
    if (busy.current) return;
    busy.current = true;
    setPending(true);
    const session = getAuthenticatedRequestSignal();
    let savingPreference = false;
    try {
      if (enabled) {
        let permission = await Notifications.getPermissionsAsync();
        if (permission.status !== 'granted' && permission.canAskAgain) {
          permission = await Notifications.requestPermissionsAsync();
        }
        if (session.aborted) return;
        const granted = permission.status === 'granted';
        setSystemGranted(granted);
        if (!granted) {
          onPermissionRequired();
          return;
        }
      }

      // 이미 진행 중인 내 정보 조회가 저장 결과를 덮어쓰지 않게 한다.
      await queryClient.cancelQueries({
        queryKey: getMyProfileQueryOptions().queryKey,
        exact: true,
      });
      if (session.aborted) return;
      savingPreference = true;
      await getUser().updatePushNotificationSetting({ pushNotificationEnabled: enabled });
      if (session.aborted) return;
      queryClient.setQueryData(getMyProfileQueryOptions().queryKey, (me) =>
        me ? { ...me, pushNotificationEnabled: enabled } : me
      );
      trackEvent('Push Notification Setting Updated', { push_notification_enabled: enabled });
      setAnalyticsUserProperties({ push_notification_enabled: enabled });

      // 수신 동의 저장은 완료됐다. 후속 토큰 실패로 저장값을 되돌리지 않는다.
      try {
        if (enabled) await registerDevicePushToken();
        else await unregisterDevicePushToken();
      } catch (failure) {
        if (isCancel(failure) || session.aborted) return;
        logError(normalizeError(failure), {
          scope: 'notification.push',
          operation: enabled ? 'registerDevicePushToken' : 'unregisterDevicePushToken',
        });
      }
    } catch (failure) {
      if (isCancel(failure) || session.aborted) return;
      const error = normalizeError(failure);
      logError(error, { scope: 'notification.push', operation: 'updatePushPreference' });
      // API의 네트워크·서버 오류는 전역 인터셉터가 이미 안내한다.
      if (!savingPreference || !['network', 'timeout', 'server'].includes(error.type)) {
        useNetworkErrorToastStore.getState().showMessage(getUserErrorMessage(error));
      }
    } finally {
      busy.current = false;
      setPending(false);
    }
  };

  return { enabled: pushNotificationEnabled && systemGranted, pending, toggle };
}
