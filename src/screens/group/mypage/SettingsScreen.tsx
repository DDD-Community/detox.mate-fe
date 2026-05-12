import { router } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import { useState } from 'react';
import { Image, Pressable, StyleSheet, Switch, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { logout } from '../../../api/auth';
import { getUser } from '../../../api/generated/user/user';
import { primitiveColors, radius, spacing, typography } from '../../../lib/token';
import { LogoutConfirmAlert } from './LogoutConfirmAlert';
import { WithdrawConfirmAlert } from './WithdrawConfirmAlert';

const { brown, gray, green } = primitiveColors;

const ICONS = {
  caretLeft: require('../../../../assets/icons/regular/icon_rg_CaretLeft.png'),
  caretRight: require('../../../../assets/icons/regular/icon_rg_CaretRight.png'),
} as const;

interface ToggleRowProps {
  label: string;
  value: boolean;
  onChange: (next: boolean) => void;
  hasDivider?: boolean;
}

function ToggleRow({ label, value, onChange, hasDivider }: ToggleRowProps) {
  return (
    <View style={[styles.row, hasDivider && styles.rowDivider]}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Switch
        value={value}
        onValueChange={onChange}
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
      <Image source={ICONS.caretRight} style={styles.caretIcon} resizeMode="contain" />
    </Pressable>
  );
}

export default function SettingsScreen() {
  // TODO: 서버/디바이스 설정과 동기화
  const [verifyAlarm, setVerifyAlarm] = useState(true);
  const [generalAlarm, setGeneralAlarm] = useState(true);
  const [isLogoutAlertOpen, setIsLogoutAlertOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isWithdrawAlertOpen, setIsWithdrawAlertOpen] = useState(false);
  const [isWithdrawing, setIsWithdrawing] = useState(false);

  const handleBack = () => {
    router.back();
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
      const userId = await SecureStore.getItemAsync('currentUserId');
      await getUser().withdraw({
        currentUser: { id: userId ? Number(userId) : undefined },
      });
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
            <Image source={ICONS.caretLeft} style={styles.headerIcon} resizeMode="contain" />
          </Pressable>
          <Text style={styles.headerTitle}>설정</Text>
        </View>
      </SafeAreaView>

      <View style={styles.body}>
        <View style={styles.card}>
          <ToggleRow
            label="인증 알림"
            value={verifyAlarm}
            onChange={setVerifyAlarm}
            hasDivider
          />
          <ToggleRow label="알림" value={generalAlarm} onChange={setGeneralAlarm} />
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
  headerIcon: {
    width: 24,
    height: 24,
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
  caretIcon: {
    width: 24,
    height: 24,
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
