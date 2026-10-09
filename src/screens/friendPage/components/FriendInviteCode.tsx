import { QueryErrorResetBoundary } from '@tanstack/react-query';
import { Suspense } from 'react';
import { StyleSheet, Text } from 'react-native';

import { ErrorBoundary } from '@/components/AppErrorBoundary/AppErrorBoundary';
import { primitiveColors, typography } from '@/lib/token';
import { useFriendProfile } from '../hooks/useFriendProfile';

const { gray } = primitiveColors;

// 초대 코드는 부가 정보라 불러오지 못해도 이름·버튼은 보이도록 오류 시 조용히 숨긴다.
// 같은 조회의 실패는 친구 목록 영역의 경계가 기록한다.
export function FriendInviteCode({ userId }: { userId: number }) {
  return (
    <QueryErrorResetBoundary>
      {({ reset }) => (
        <ErrorBoundary onReset={reset} fallback={() => null} shouldLogError={() => false}>
          <Suspense fallback={null}>
            <InviteCodeText userId={userId} />
          </Suspense>
        </ErrorBoundary>
      )}
    </QueryErrorResetBoundary>
  );
}

function InviteCodeText({ userId }: { userId: number }) {
  const { userCode } = useFriendProfile(userId);
  return userCode ? <Text style={styles.code}>{userCode}</Text> : null;
}

const styles = StyleSheet.create({
  code: { ...typography.primary.body2R, fontSize: 15, lineHeight: 22, color: gray[300] },
});
