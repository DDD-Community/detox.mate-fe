import { Redirect, useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { minimizeApp, ScreenTimeReportView } from '../../../modules/screen-time-report';
import { getAppLockNotification } from '../../api';
import { resetOverLimitExceeded, syncUnlockNoticeNames } from '../../lib/sharedDisplayConfig';
import { useLockStore } from '../../stores/lockStore';
import { spacing } from '../../lib/token';
import { TenSecondCountdownScreen } from './TenSecondCountdownScreen';

/**
 * 알림 탭(또는 쉴드에서 바로) 후 뜨는 10초 재고 화면. 시간이 다 되면 몇 분 더
 * 사용할지 설정하는 화면으로 이동한다. "안해도 될 것 같아요"는 iOS가 앱 자체 종료를
 * 허용하지 않아서, 홈 버튼을 누른 것처럼 백그라운드로 내려보낸다.
 */
export default function UnlockTimerScreen() {
  const router = useRouter();
  const { appId } = useLocalSearchParams<{ appId?: string }>();
  // 이 화면에 들어올 때마다 서버가 새로 뽑은 친구 이름. 조회 전이나 실패 시에는 비어 있다.
  const [recipients, setRecipients] = useState<{ userId: number; displayName: string }[]>([]);
  const { lockedApps, familyActivitySelectionsByAppId } = useLockStore();
  const [hydrated, setHydrated] = useState(useLockStore.persist.hasHydrated);
  const allSelectionTokens = Object.values(familyActivitySelectionsByAppId);

  useEffect(() => {
    const unsubscribe = useLockStore.persist.onFinishHydration(() => setHydrated(true));
    setHydrated(useLockStore.persist.hasHydrated());
    return unsubscribe;
  }, []);

  // 친구 알림 안내는 제한 시간을 넘긴 경우에만 보여 준다. 사용 시간은 리포트 확장만 알아서, 이름만
  // 앱 그룹에 써두고 넘겼는지 판단과 문구 표시는 확장이 한다.
  useEffect(() => {
    syncUnlockNoticeNames(recipients.map((recipient) => recipient.displayName));
  }, [recipients]);

  // 이전 해제 흐름에서 남은 "제한 초과" 값을 지운다. 이번 흐름의 값은 리포트 확장이 다시 써 준다.
  useEffect(() => {
    resetOverLimitExceeded();
  }, []);

  useEffect(() => {
    let active = true;
    getAppLockNotification()
      .previewRemovalRecipients()
      .then((response) => {
        if (!active) return;
        setRecipients(
          (response.recipients ?? []).flatMap((recipient) =>
            recipient.userId !== undefined && recipient.displayName
              ? [{ userId: recipient.userId, displayName: recipient.displayName }]
              : []
          )
        );
      })
      // 네트워크 실패는 전역 토스트가 안내한다. 이름을 모르면 안내를 숨기고 진행한다.
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);

  if (!hydrated) return <ActivityIndicator accessibilityLabel="제한 앱 불러오는 중" />;
  if (!appId || !lockedApps.some((app) => app.id === appId)) {
    return <Redirect href="/(tabs)/restricted-apps" />;
  }

  return (
    <View style={styles.root}>
      <SafeAreaView style={styles.safeArea}>
        <TenSecondCountdownScreen
          title="10초 동안 다시 생각해볼까요?"
          notice={
            allSelectionTokens.length > 0 ? (
              <ScreenTimeReportView
                selectionTokens={allSelectionTokens}
                reportStyle="overLimitNotice"
                style={styles.overLimitNotice}
              />
            ) : null
          }
          cancelLabel="안해도 될 것 같아요"
          onCancel={minimizeApp}
          onComplete={() =>
            router.replace({
              pathname: '/(lock)/unlock-duration',
              // 화면에 보여 준 친구를 해제 확정 단계까지 그대로 전달한다.
              params: { appId, recipientUserIds: recipients.map((r) => r.userId).join(',') },
            })
          }
        />
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  overLimitNotice: {
    height: 16,
  },
  root: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  safeArea: {
    flex: 1,
    paddingHorizontal: spacing[16],
    paddingBottom: spacing[16],
  },
});
