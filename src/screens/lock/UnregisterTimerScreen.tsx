import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { getAppLockNotification, getUser } from '../../api';
import { spacing } from '../../lib/token';
import { TenSecondCountdownScreen } from './TenSecondCountdownScreen';

/**
 * "등록 해제" 요청 직후 10초 재고 화면. 시간이 다 되면 사유 선택 화면으로 넘어간다.
 */
export default function UnregisterTimerScreen() {
  const router = useRouter();
  const { appId } = useLocalSearchParams<{ appId: string }>();
  // 이 화면에 들어올 때마다 서버가 새로 뽑은 수신자. 마지막 확인 모달에서 이 친구들에게 그대로 보낸다.
  const [recipients, setRecipients] = useState<{ userId: number; displayName: string }[]>([]);
  const [displayName, setDisplayName] = useState('');

  useEffect(() => {
    getUser()
      .getMe()
      .then((me) => setDisplayName(me.displayName ?? ''))
      .catch(() => {});
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
      // 네트워크 실패는 전역 토스트가 안내한다. 수신자를 모르면 안내와 미리보기를 숨기고 진행한다.
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);

  // 알림을 받을 친구가 없으면 "에게 알림이 가요" 안내와 푸시 미리보기를 보여주지 않는다.
  const hasRecipients = recipients.length > 0;

  return (
    <View style={styles.root}>
      <SafeAreaView style={styles.safeArea}>
        <TenSecondCountdownScreen
          title="10초 동안 다시 생각해볼까요?"
          notifiedFriends={hasRecipients ? recipients.map((r) => r.displayName) : undefined}
          notificationPreview={
            hasRecipients ? `${`${displayName || '회원'}님이`} 앱을 등록 해제했어요.` : undefined
          }
          pauseInBackground
          cancelLabel="해제 안 할래요"
          onCancel={() => router.back()}
          onComplete={() =>
            router.replace({
              pathname: '/(lock)/unregister-reason',
              params: { appId, recipientUserIds: recipients.map((r) => r.userId).join(',') },
            })
          }
        />
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
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
