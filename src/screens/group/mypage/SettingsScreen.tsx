import * as Linking from 'expo-linking';
import * as Notifications from 'expo-notifications';
import { router, useFocusEffect } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState, Pressable, StyleSheet, Switch, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { logout } from '../../../api/auth';
import { getUser } from '../../../api/generated/user/user';
import {
  ensureDevicePushTokenRegistered,
  registerDevicePushToken,
  unregisterDevicePushToken,
} from '../../../lib/fcmToken';
import { Icon } from '../../../components/Icon';
import { primitiveColors, radius, spacing, typography } from '../../../lib/token';
import { LogoutConfirmAlert } from './LogoutConfirmAlert';
import { NotificationPermissionAlert } from './NotificationPermissionAlert';
import { WithdrawConfirmAlert } from './WithdrawConfirmAlert';

const { brown, gray, green } = primitiveColors;

interface ToggleRowProps {
  label: string;
  value: boolean;
  onChange: (next: boolean) => void;
  disabled?: boolean;
  hasDivider?: boolean;
}

function ToggleRow({ label, value, onChange, disabled, hasDivider }: ToggleRowProps) {
  return (
    <View style={[styles.row, hasDivider && styles.rowDivider]}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Switch
        value={value}
        onValueChange={onChange}
        disabled={disabled}
        trackColor={{ false: gray[200], true: green[400] }}
        thumbColor="#FFFFFF"
        ios_backgroundColor={gray[200]}
      />
    </View>
  );
}

interface LinkRowProps {
  label: string;
  onPress: () => void;
  hasDivider?: boolean;
}

function LinkRow({ label, onPress, hasDivider }: LinkRowProps) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.row,
        styles.linkRow,
        hasDivider && styles.rowDivider,
        pressed && styles.rowPressed,
      ]}
    >
      <Text style={styles.rowLabel}>{label}</Text>
      <Icon name="caretRight" size={24} color={gray[900]} />
    </Pressable>
  );
}

export default function SettingsScreen() {
  // 두 가지 상태를 분리 추적
  //   userPushPreference: 사용자가 앱 내 토글로 명시한 수신 의도 (TODO: 서버/SecureStore 동기화)
  //   systemGranted:      iOS/Android 시스템 알림 권한 상태 (매번 체크)
  // 토글 표시값 = 둘 다 true일 때만 ON
  const [userPushPreference, setUserPushPreference] = useState<boolean | null>(null);
  const userPushPreferenceRef = useRef<boolean | null>(null);
  const [systemGranted, setSystemGranted] = useState(false);
  const pushAlarm = userPushPreference === true && systemGranted;
  const [isPushUpdating, setIsPushUpdating] = useState(false);
  const pushToggleDisabled = userPushPreference === null || isPushUpdating;

  const [isPermissionAlertOpen, setIsPermissionAlertOpen] = useState(false);
  const [isLogoutAlertOpen, setIsLogoutAlertOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isWithdrawAlertOpen, setIsWithdrawAlertOpen] = useState(false);
  const [isWithdrawing, setIsWithdrawing] = useState(false);

  const updateUserPushPreference = useCallback((next: boolean | null) => {
    userPushPreferenceRef.current = next;
    setUserPushPreference(next);
  }, []);

  const syncSystemPermission = useCallback(async () => {
    const { status } = await Notifications.getPermissionsAsync();
    const granted = status === 'granted';
    setSystemGranted(granted);
    // 사용자가 OS 설정에서 권한을 허용하고 돌아온 경우 토큰이 비어있으면 사후 등록.
    // 앱 내 동의(userPushPreference)가 OFF면 등록하지 않음.
    if (granted && userPushPreferenceRef.current === true) {
      try {
        await ensureDevicePushTokenRegistered();
      } catch {
        // ignore
      }
    }
  }, []);

  // 마운트 시 서버의 푸시 알림 동의 상태 가져오기
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const me = await getUser().getMe();
      if (cancelled) return;
      updateUserPushPreference(me.pushNotificationEnabled ?? true);
    })();
    return () => {
      cancelled = true;
    };
  }, [updateUserPushPreference]);

  useEffect(() => {
    if (userPushPreference !== true || !systemGranted || isPushUpdating) return;
    ensureDevicePushTokenRegistered().catch(() => {
      // ignore
    });
  }, [isPushUpdating, systemGranted, userPushPreference]);

  const patchPushNotificationEnabled = async (enabled: boolean) => {
    await getUser().updatePushNotificationSetting({ pushNotificationEnabled: enabled });
  };

  // 화면 진입 + 설정 앱에서 돌아왔을 때 권한 상태 재동기화
  useFocusEffect(
    useCallback(() => {
      syncSystemPermission();
      const sub = AppState.addEventListener('change', (next) => {
        if (next === 'active') syncSystemPermission();
      });
      return () => sub.remove();
    }, [syncSystemPermission])
  );

  const handleBack = () => {
    router.back();
  };

  const applyPushPreference = async (enabled: boolean) => {
    // optimistic update: state 먼저 반영 후 API 실패 시 롤백
    const previous = userPushPreferenceRef.current ?? false;
    updateUserPushPreference(enabled);
    try {
      await patchPushNotificationEnabled(enabled);
    } catch (e) {
      updateUserPushPreference(previous);
      return;
    }
    // 푸시 토큰 등록/삭제는 best-effort. 실패해도 동의 설정 자체는 유지.
    try {
      if (enabled) {
        await registerDevicePushToken();
      } else {
        await unregisterDevicePushToken();
      }
    } catch {
      // ignore
    }
  };

  const handleTogglePushAlarm = async (next: boolean) => {
    if (isPushUpdating || userPushPreference === null) return;
    setIsPushUpdating(true);
    try {
      if (!next) {
        // ON → OFF: 앱 내 수신 동의만 OFF로. 시스템 권한은 안 건드림.
        // 서버가 더 이상 푸시를 보내지 않게 되어 사용자에겐 "알림이 꺼진" 효과와 동일.
        await applyPushPreference(false);
        return;
      }
      // OFF → ON: 시스템 권한 확인
      const { status, canAskAgain } = await Notifications.getPermissionsAsync();
      if (status === 'granted') {
        setSystemGranted(true);
        await applyPushPreference(true);
        return;
      }
      if (canAskAgain) {
        const result = await Notifications.requestPermissionsAsync();
        if (result.status === 'granted') {
          setSystemGranted(true);
          await applyPushPreference(true);
          return;
        }
      }
      // 권한 거부 + 다시 물어볼 수 없는 상태 → 설정 안내 모달
      setIsPermissionAlertOpen(true);
    } finally {
      setIsPushUpdating(false);
    }
  };

  const handleClosePermissionAlert = () => {
    setIsPermissionAlertOpen(false);
  };

  const handleOpenAppSettings = async () => {
    setIsPermissionAlertOpen(false);
    await Linking.openSettings();
  };

  const handleContact = () => {
    // TODO: 문의하기 — Linking.openURL or 문의 화면 이동
  };

  const handleTerms = () => {
    // TODO: 서비스 이용 약관 링크
  };

  const handlePrivacy = () => {
    // TODO: 개인정보 처리방침 링크
  };

  const handleOpenLogoutAlert = () => {
    setIsLogoutAlertOpen(true);
  };

  const handleCloseLogoutAlert = () => {
    if (isLoggingOut) return;
    setIsLogoutAlertOpen(false);
  };

  const handleConfirmLogout = async () => {
    if (isLoggingOut) return;
    setIsLoggingOut(true);
    try {
      // 푸시 토큰 제거는 best-effort. 실패해도 로그아웃은 진행.
      try {
        await unregisterDevicePushToken();
      } catch {
        // ignore
      }
      await logout();
      setIsLogoutAlertOpen(false);
      router.replace('/(auth)/login');
    } finally {
      setIsLoggingOut(false);
    }
  };

  const handleOpenWithdrawAlert = () => {
    setIsWithdrawAlertOpen(true);
  };

  const handleCloseWithdrawAlert = () => {
    if (isWithdrawing) return;
    setIsWithdrawAlertOpen(false);
  };

  const handleConfirmWithdraw = async () => {
    if (isWithdrawing) return;
    setIsWithdrawing(true);
    try {
      // 푸시 토큰 제거는 best-effort. 실패해도 탈퇴는 진행.
      try {
        await unregisterDevicePushToken();
      } catch {
        // ignore
      }
      await getUser().withdraw();
      await SecureStore.deleteItemAsync('refreshTokenKey');
      await SecureStore.deleteItemAsync('accessTokenKey');
      await SecureStore.deleteItemAsync('currentUserId');
      setIsWithdrawAlertOpen(false);
      router.replace('/(auth)/login');
    } finally {
      setIsWithdrawing(false);
    }
  };

  return (
    <View style={styles.root}>
      <SafeAreaView edges={['top']}>
        <View style={styles.header}>
          <Pressable onPress={handleBack} hitSlop={8}>
            <Icon name="caretLeft" size={24} color={gray[800]} />
          </Pressable>
          <Text style={styles.headerTitle}>설정</Text>
        </View>
      </SafeAreaView>

      <View style={styles.body}>
        <View style={styles.card}>
          <ToggleRow
            label="푸시 알림"
            value={pushAlarm}
            onChange={handleTogglePushAlarm}
            disabled={pushToggleDisabled}
          />
        </View>

        <View style={styles.card}>
          <LinkRow label="문의하기" onPress={handleContact} hasDivider />
          <LinkRow label="서비스 이용 약관" onPress={handleTerms} hasDivider />
          <LinkRow label="개인정보 처리방침" onPress={handlePrivacy} hasDivider />
          <LinkRow label="로그아웃" onPress={handleOpenLogoutAlert} />
        </View>

        <Pressable onPress={handleOpenWithdrawAlert} hitSlop={8} style={styles.withdrawWrap}>
          <Text style={styles.withdrawText}>회원 탈퇴</Text>
        </Pressable>
      </View>

      <LogoutConfirmAlert
        visible={isLogoutAlertOpen}
        onClose={handleCloseLogoutAlert}
        onConfirm={handleConfirmLogout}
        loading={isLoggingOut}
      />

      <WithdrawConfirmAlert
        visible={isWithdrawAlertOpen}
        onClose={handleCloseWithdrawAlert}
        onConfirm={handleConfirmWithdraw}
        loading={isWithdrawing}
      />

      <NotificationPermissionAlert
        visible={isPermissionAlertOpen}
        onClose={handleClosePermissionAlert}
        onConfirm={handleOpenAppSettings}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: brown[50],
  },
  header: {
    height: 54,
    paddingHorizontal: spacing[16],
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[16],
  },
  headerTitle: {
    ...typography.accent.title2,
    color: gray[800],
  },
  body: {
    flex: 1,
    paddingHorizontal: spacing[16],
    paddingTop: spacing[20],
    gap: spacing[20],
    alignItems: 'center',
  },
  card: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: radius[12],
    paddingHorizontal: spacing[12],
    paddingVertical: spacing[8],
  },
  row: {
    paddingHorizontal: spacing[12],
    paddingVertical: spacing[8],
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  linkRow: {
    height: 44,
  },
  rowDivider: {
    borderBottomWidth: 0.5,
    borderBottomColor: '#F0F1F3',
  },
  rowPressed: {
    opacity: 0.6,
  },
  rowLabel: {
    ...typography.primary.body1R,
    color: gray[800],
  },
  withdrawWrap: {
    marginTop: spacing[4],
    alignSelf: 'center',
  },
  withdrawText: {
    ...typography.primary.caption,
    color: gray[400],
    textDecorationLine: 'underline',
  },
});
