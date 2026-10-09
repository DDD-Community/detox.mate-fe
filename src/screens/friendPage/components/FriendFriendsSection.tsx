import { QueryErrorResetBoundary } from '@tanstack/react-query';
import { Suspense } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import { ErrorBoundary } from '@/components/AppErrorBoundary/AppErrorBoundary';
import { primitiveColors, spacing, typography } from '@/lib/token';
import { FriendsPreview } from '@/screens/mypage/components/FriendsPreview';
import { useFriendProfile } from '../hooks/useFriendProfile';

const { gray, green } = primitiveColors;

// 친구의 친구 목록은 부가 영역이라 불러오지 못하면 이 영역만 숨기고 실패는 기록한다.
export function FriendFriendsSection({ userId }: { userId: number }) {
  return (
    <QueryErrorResetBoundary>
      {({ reset }) => (
        <ErrorBoundary onReset={reset} fallback={() => null}>
          <Suspense
            fallback={
              <ActivityIndicator
                color={green[300]}
                style={styles.loading}
                accessibilityLabel="친구 목록 불러오는 중"
              />
            }
          >
            <FriendFriendsContent userId={userId} />
          </Suspense>
        </ErrorBoundary>
      )}
    </QueryErrorResetBoundary>
  );
}

function FriendFriendsContent({ userId }: { userId: number }) {
  const { friends } = useFriendProfile(userId);

  return (
    <View style={styles.root}>
      <Text style={styles.title}>친구 목록</Text>
      {friends.length > 0 ? (
        // 이 목록의 항목은 눌러도 동작하지 않는다(시안·API 명세).
        <FriendsPreview items={friends} />
      ) : (
        <View style={styles.empty}>
          <Text style={styles.emptyTitle}>아직 친구가 없어요</Text>
          <Text style={styles.emptyDescription}>
            {'친구 요청을 보내\n함께 디지털 디톡스 시작해보세요!'}
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  loading: { marginTop: spacing[24], padding: spacing[24] },
  root: { marginTop: spacing[24], gap: spacing[12] },
  title: { ...typography.primary.title1B, marginHorizontal: spacing[16], color: gray[900] },
  empty: { alignItems: 'center', paddingTop: spacing[32], gap: spacing[4] },
  emptyTitle: { ...typography.primary.body1R, color: gray[900] },
  emptyDescription: { ...typography.primary.body2R, textAlign: 'center', color: gray[300] },
});
