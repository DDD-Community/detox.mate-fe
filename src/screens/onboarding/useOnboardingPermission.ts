import * as Notifications from 'expo-notifications';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, AppState, Linking } from 'react-native';
import * as DeviceActivity from 'react-native-device-activity';
import { getUserErrorMessage, logError, normalizeError } from '@/api/errors';
import { registerDevicePushToken } from '@/lib/fcmToken';

export type OnboardingPermission = 'screen-time' | 'notifications';

export function useOnboardingPermission(permission: OnboardingPermission, onGranted: () => void) {
  const [pending, setPending] = useState(false);
  const busy = useRef(false);
  const active = useRef(true);
  const completed = useRef(false);
  const granted = useRef(onGranted);
  granted.current = onGranted;

  const proceed = useCallback(async () => {
    if (permission === 'notifications') {
      try {
        await registerDevicePushToken();
      } catch (error) {
        logError(normalizeError(error), {
          scope: 'notification.push',
          operation: 'registerDevicePushToken',
        });
      }
    }
    if (active.current && !completed.current) {
      completed.current = true;
      granted.current();
    }
  }, [permission]);
  const isGranted = useCallback(
    async () =>
      permission === 'screen-time'
        ? DeviceActivity.getAuthorizationStatus() === DeviceActivity.AuthorizationStatus.approved
        : (await Notifications.getPermissionsAsync()).granted,
    [permission]
  );

  useEffect(() => {
    active.current = true;
    const check = async () => {
      if (busy.current || completed.current) return;
      busy.current = true;
      try {
        if (await isGranted()) await proceed();
      } catch (error) {
        logError(normalizeError(error), {
          scope: 'auth.login',
          operation: 'checkOnboardingPermission',
        });
      } finally {
        busy.current = false;
      }
    };
    void check();
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') void check();
    });
    return () => {
      active.current = false;
      subscription.remove();
    };
  }, [isGranted, proceed]);

  function showError(error: unknown) {
    const appError = normalizeError(error);
    logError(appError, { scope: 'auth.login', operation: 'requestOnboardingPermission' });
    if (active.current) Alert.alert('권한을 확인해 주세요', getUserErrorMessage(appError));
  }
  function showSettings() {
    Alert.alert('권한 허용이 필요해요', '설정에서 권한을 허용한 뒤 다시 돌아와 주세요.', [
      { text: '취소', style: 'cancel' },
      {
        text: '설정으로 가기',
        onPress: () => {
          void Linking.openSettings().catch(showError);
        },
      },
    ]);
  }
  const request = async () => {
    if (busy.current || completed.current) return;
    busy.current = true;
    setPending(true);
    try {
      if (await isGranted()) {
        await proceed();
        return;
      }
      if (permission === 'screen-time') {
        if (DeviceActivity.getAuthorizationStatus() === DeviceActivity.AuthorizationStatus.denied) {
          showSettings();
          return;
        }
        await DeviceActivity.requestAuthorization('individual');
      } else if ((await Notifications.getPermissionsAsync()).canAskAgain)
        await Notifications.requestPermissionsAsync();
      if (await isGranted()) {
        await proceed();
        return;
      }
      showSettings();
    } catch (error) {
      if (
        permission === 'screen-time' &&
        DeviceActivity.getAuthorizationStatus() === DeviceActivity.AuthorizationStatus.denied
      )
        showSettings();
      else showError(error);
    } finally {
      busy.current = false;
      if (active.current) setPending(false);
    }
  };
  return { pending, request };
}
