import { Image } from 'expo-image';
import backIcon from '@assets/settings/back.svg';
import chevronIcon from '@assets/settings/chevron.svg';
import * as Linking from 'expo-linking';
import { overlay } from 'overlay-kit';
import { Platform, Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { getUserErrorMessage, logError, normalizeError } from '@/api/errors';
import { LoggingButton, LoggingPage } from '@/components';
import { env } from '@/config/env';
import { goBackOrReplace } from '@/lib/navigation';
import { primitiveColors, spacing, typography } from '@/lib/token';
import { useNetworkErrorToastStore } from '@/stores/networkErrorToastStore';
import { NotificationPermissionAlert } from './NotificationPermissionAlert';
import { SettingsAccountDialog } from './SettingsAccountDialog';
import { useSettingsPushNotifications } from './useSettingsPushNotifications';
import { useSettingsScreenTimePermission } from './useSettingsScreenTimePermission';

const { gray, green } = primitiveColors;
const appVersionLabel =
  env.appEnv === 'development'
    ? env.buildChannel === 'local' && env.gitSha
      ? `${env.appVersion} DEV · ${env.gitSha}`
      : `${env.appVersion} DEV`
    : env.appVersion;

function ToggleRow({
  label,
  value,
  onChange,
  disabled,
}: {
  label: string;
  value: boolean;
  onChange: (next: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Switch
        accessibilityLabel={label}
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

function LinkRow({
  label,
  value,
  onPress,
  showChevron = true,
  disabled,
}: {
  label: string;
  value?: string;
  onPress: () => void;
  showChevron?: boolean;
  disabled?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={value ? `${label}, ${value}` : label}
      accessibilityState={{ disabled }}
      style={({ pressed }) => [styles.row, (pressed || disabled) && styles.rowPressed]}
    >
      <Text style={styles.rowLabel}>{label}</Text>
      <View style={styles.rowRight}>
        {value && <Text style={styles.rowValue}>{value}</Text>}
        {showChevron && <Image source={chevronIcon} style={styles.icon} contentFit="contain" />}
      </View>
    </Pressable>
  );
}

export default function SettingsScreen() {
  const screenTime = useSettingsScreenTimePermission();
  const push = useSettingsPushNotifications(() => {
    overlay.open(({ isOpen, close, unmount }) => {
      const dismiss = () => {
        close();
        if (Platform.OS !== 'ios') unmount();
      };
      return (
        <NotificationPermissionAlert
          visible={isOpen}
          onClose={dismiss}
          onDismiss={unmount}
          onConfirm={() => {
            dismiss();
            void Linking.openSettings().catch(reportLinkError);
          }}
        />
      );
    });
  });

  function reportLinkError(failure: unknown) {
    const error = normalizeError(failure);
    logError(error, { scope: 'api', operation: 'settings.openLink' });
    useNetworkErrorToastStore.getState().showMessage(getUserErrorMessage(error));
  }

  const handleBack = () => goBackOrReplace('/(tabs)/mypage');
  const handleContact = () =>
    void Linking.openURL(
      'https://docs.google.com/forms/d/e/1FAIpQLSew334-Pk-oTV-kJsT_OOn6CPOqhH14CySHF07ZzgC9RuKwaA/viewform'
    ).catch(reportLinkError);
  const handleTerms = () =>
    void Linking.openURL(
      'https://app.notion.com/p/happysisyphe/342ad7a38ce58022b466ffec4ca39482?source=copy_link'
    ).catch(reportLinkError);
  const handlePrivacy = () =>
    void Linking.openURL(
      'https://app.notion.com/p/happysisyphe/342ad7a38ce580e1ba8ac09e06c96dca?source=copy_link'
    ).catch(reportLinkError);

  const openAccountDialog = (action: 'logout' | 'withdraw') => {
    overlay.open(({ isOpen, close, unmount }) => (
      <SettingsAccountDialog
        action={action}
        visible={isOpen}
        onClose={() => {
          close();
          if (Platform.OS !== 'ios') unmount();
        }}
        onDismiss={unmount}
      />
    ));
  };

  return (
    <LoggingPage eventName="Settings Viewed" properties={{ pageName: 'Settings' }}>
      <View style={styles.root}>
        <SafeAreaView edges={['top']}>
          <View style={styles.header}>
            <LoggingButton
              eventName="Settings Back Clicked"
              properties={{ pageName: 'Settings', buttonName: '뒤로가기' }}
            >
              <Pressable
                onPress={handleBack}
                hitSlop={8}
                style={styles.headerBackButton}
                accessibilityRole="button"
                accessibilityLabel="뒤로가기"
              >
                <Image source={backIcon} style={styles.icon} contentFit="contain" />
              </Pressable>
            </LoggingButton>
            <Text style={styles.headerTitle} numberOfLines={1}>
              설정
            </Text>
          </View>
        </SafeAreaView>

        <ScrollView contentContainerStyle={styles.body}>
          <View style={styles.card}>
            <ToggleRow
              label="푸시 알림"
              value={push.enabled}
              onChange={push.toggle}
              disabled={push.pending}
            />
            <View style={styles.separator} />
            <LoggingButton
              eventName="Settings Screen Time Permission Open Clicked"
              properties={{ pageName: 'Settings', buttonName: '스크린타임 권한' }}
            >
              <LinkRow
                label="스크린타임 권한"
                value={screenTime.granted ? '허용됨' : '허용 안 됨'}
                onPress={screenTime.request}
                disabled={screenTime.pending}
              />
            </LoggingButton>
          </View>

          <View style={styles.card}>
            <LoggingButton
              eventName="Settings Contact Open Clicked"
              properties={{ pageName: 'Settings', buttonName: '문의하기' }}
            >
              <LinkRow label="문의하기" onPress={handleContact} />
            </LoggingButton>
            <View style={styles.separator} />
            <LoggingButton
              eventName="Settings Terms Open Clicked"
              properties={{ pageName: 'Settings', buttonName: '서비스 이용 약관' }}
            >
              <LinkRow label="서비스 이용 약관" onPress={handleTerms} />
            </LoggingButton>
            <View style={styles.separator} />
            <LoggingButton
              eventName="Settings Privacy Open Clicked"
              properties={{ pageName: 'Settings', buttonName: '개인정보 처리방침' }}
            >
              <LinkRow label="개인정보 처리방침" onPress={handlePrivacy} />
            </LoggingButton>
            <View style={styles.separator} />
            <LoggingButton
              eventName="Settings Logout Alert Open Clicked"
              properties={{ pageName: 'Settings', buttonName: '로그아웃' }}
            >
              <LinkRow
                showChevron={false}
                label="로그아웃"
                onPress={() => openAccountDialog('logout')}
              />
            </LoggingButton>
          </View>

          <View style={styles.card}>
            <View style={styles.row}>
              <Text style={styles.rowLabel}>버전 정보</Text>
              <Text style={styles.rowValue}>{appVersionLabel}</Text>
            </View>
            <View style={styles.separator} />
            <LoggingButton
              eventName="Settings Withdraw Alert Open Clicked"
              properties={{ pageName: 'Settings', buttonName: '회원 탈퇴' }}
            >
              <LinkRow
                label="회원 탈퇴"
                showChevron={false}
                onPress={() => openAccountDialog('withdraw')}
              />
            </LoggingButton>
          </View>
        </ScrollView>
      </View>
    </LoggingPage>
  );
}

const styles = StyleSheet.create({
  icon: { width: 24, height: 24 },
  root: { flex: 1, backgroundColor: '#FFFFFF' },
  header: {
    height: 54,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing[16],
    gap: spacing[8],
  },
  headerBackButton: { width: 24, height: 44, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { ...typography.primary.title1M, lineHeight: 28, color: gray[800] },
  body: {
    paddingHorizontal: spacing[16],
    paddingTop: spacing[16],
    paddingBottom: spacing[40],
    gap: spacing[20],
  },
  card: { width: '100%', backgroundColor: gray[50], borderRadius: 26, overflow: 'hidden' },
  row: {
    minHeight: 52,
    paddingHorizontal: spacing[16],
    paddingVertical: spacing[8],
    gap: spacing[8],
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  rowRight: { flexDirection: 'row', alignItems: 'center', gap: spacing[4] },
  separator: {
    height: StyleSheet.hairlineWidth,
    marginLeft: spacing[16],
    backgroundColor: 'rgba(60,60,67,0.29)',
  },
  rowPressed: { opacity: 0.6 },
  rowLabel: {
    ...typography.primary.body1R,
    fontSize: 17,
    lineHeight: 26,
    color: gray[900],
    flexShrink: 1,
  },
  rowValue: {
    ...typography.primary.body1R,
    fontSize: 17,
    lineHeight: 26,
    color: gray[300],
    flexShrink: 1,
    textAlign: 'right',
  },
});
