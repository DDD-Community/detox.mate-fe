import { useFocusEffect } from 'expo-router';
import { useCallback, useRef, useState } from 'react';
import { Alert, AppState, Linking } from 'react-native';
import * as DeviceActivity from 'react-native-device-activity';

import { getUserErrorMessage, logError, normalizeError } from '@/api/errors';

export function useSettingsScreenTimePermission() {
  const [status, setStatus] = useState(DeviceActivity.getAuthorizationStatus);
  const [pending, setPending] = useState(false);
  const busy = useRef(false);

  useFocusEffect(
    useCallback(() => {
      const refresh = () => setStatus(DeviceActivity.getAuthorizationStatus());
      refresh();
      const authorization = DeviceActivity.onAuthorizationStatusChange(refresh);
      const appState = AppState.addEventListener('change', (state) => {
        if (state === 'active') refresh();
      });
      return () => {
        authorization.remove();
        appState.remove();
      };
    }, [])
  );

  function showError(failure: unknown) {
    const error = normalizeError(failure);
    logError(error, { scope: 'api', operation: 'settings.screenTimePermission' });
    Alert.alert('권한을 확인해 주세요', getUserErrorMessage(error));
  }

  function showSettings() {
    Alert.alert(
      '스크린타임 권한',
      '기기의 설정 > 스크린 타임에서 디톡스메이트의 접근 권한을 관리해 주세요.',
      [
        { text: '취소', style: 'cancel' },
        { text: '설정으로 가기', onPress: () => void Linking.openSettings().catch(showError) },
      ]
    );
  }

  const request = async () => {
    if (busy.current) return;
    busy.current = true;
    setPending(true);
    try {
      if (
        DeviceActivity.getAuthorizationStatus() !== DeviceActivity.AuthorizationStatus.notDetermined
      ) {
        showSettings();
        return;
      }
      await DeviceActivity.requestAuthorization('individual');
      if (DeviceActivity.getAuthorizationStatus() !== DeviceActivity.AuthorizationStatus.approved) {
        showSettings();
      }
    } catch (failure) {
      if (DeviceActivity.getAuthorizationStatus() === DeviceActivity.AuthorizationStatus.denied) {
        showSettings();
      } else showError(failure);
    } finally {
      setStatus(DeviceActivity.getAuthorizationStatus());
      busy.current = false;
      setPending(false);
    }
  };

  return { granted: status === DeviceActivity.AuthorizationStatus.approved, pending, request };
}
