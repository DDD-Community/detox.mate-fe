import { Redirect, useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { minimizeApp, ScreenTimeReportView } from '../../../modules/screen-time-report';
import { syncUnlockNoticeNames } from '../../lib/sharedDisplayConfig';
import { useLockStore } from '../../stores/lockStore';
import { spacing } from '../../lib/token';
import { pickRandomFriendNames } from './mockLockApps';
import { TenSecondCountdownScreen } from './TenSecondCountdownScreen';

/**
 * 알림 탭(또는 쉴드에서 바로) 후 뜨는 10초 재고 화면. 시간이 다 되면 몇 분 더
 * 사용할지 설정하는 화면으로 이동한다. "안해도 될 것 같아요"는 iOS가 앱 자체 종료를
 * 허용하지 않아서, 홈 버튼을 누른 것처럼 백그라운드로 내려보낸다.
 */
export default function UnlockTimerScreen() {
  const router = useRouter();
  const { appId } = useLocalSearchParams<{ appId?: string }>();
  const [notifiedFriends] = useState(() => pickRandomFriendNames(3));
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
    syncUnlockNoticeNames(notifiedFriends);
  }, [notifiedFriends]);

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
              params: { appId },
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
