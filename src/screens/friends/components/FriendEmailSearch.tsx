import {
  QueryErrorResetBoundary,
  useQueryClient,
  useQuery,
  type QueryClient,
} from '@tanstack/react-query';
import { isCancel } from 'axios';
import { Image } from 'expo-image';
import { Suspense, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';

import type { FriendSearchResponse } from '../../../api/query-generated/model';
import { logError, normalizeError } from '../../../api/errors';
import { requireId } from '../utils/friendsListData';
import { ErrorBoundary } from '../../../components/AppErrorBoundary/AppErrorBoundary';
import { isCurrentAuthQueryScope, type AuthQueryScope } from '../../../lib/query/authQueryScope';
import { fontFamily } from '../../../lib/token/primitive/fonts';
import { useSendFriendRequest } from '../hooks/useSendFriendRequest';
import { searchQueryOptions } from '../utils/friendsQueryOptions';
import { FriendsQueryFeedback } from './FriendsQuerySection';
import searchAvatar from '@assets/avatars/friend-search.svg';

const { regular, bold } = fontFamily.primary;
const missingEmail = (error: unknown) => {
  const normalized = normalizeError(error);
  return normalized.status === 404 && normalized.code === 'NOT_FOUND';
};

// Query 실패는 캐시에 유지하고 Suspense는 조회가 끝났다는 사실만 기다린다.
const readinessByRequest = new WeakMap<Promise<unknown>, Promise<void>>();
function suspendSearch(client: QueryClient, options: ReturnType<typeof searchQueryOptions>): never {
  let query = client.getQueryCache().find({ queryKey: options.queryKey, exact: true });
  if (!query || query.state.fetchStatus === 'idle') {
    void client.prefetchQuery(options);
    query = client.getQueryCache().find({ queryKey: options.queryKey, exact: true });
  }
  const request = query?.promise;
  if (!request) throw new Error('친구 정보를 불러오지 못했어요. 다시 시도해주세요.');
  let readiness = readinessByRequest.get(request);
  if (!readiness) {
    readiness = request.then(
      () => undefined,
      () => undefined
    );
    readinessByRequest.set(request, readiness);
  }
  throw readiness;
}

function SearchResult({
  email,
  scope,
  onReceived,
  renderFriend,
  user,
}: {
  email: string;
  user: FriendSearchResponse;
  scope: AuthQueryScope;
  onReceived: () => void;
  renderFriend: (userId: number) => React.ReactNode;
}) {
  const { send, pending, error } = useSendFriendRequest(email, user, scope);
  const [imageFailed, setImageFailed] = useState(false);
  useEffect(() => setImageFailed(false), [user.profileImageUrl]);
  const requested = user.relationshipStatus === 'PENDING_SENT';
  const received = user.relationshipStatus === 'PENDING_RECEIVED';
  requireId(user.userId);
  if (
    !user.relationshipStatus ||
    !['NONE', 'SELF', 'FRIEND', 'PENDING_SENT', 'PENDING_RECEIVED'].includes(
      user.relationshipStatus
    )
  ) {
    throw new Error('친구 정보를 불러오지 못했어요. 다시 시도해주세요.');
  }
  if (user.relationshipStatus === 'FRIEND') return renderFriend(user.userId!);
  const count = user.mutualFriendCount ?? 0;
  const name = user.mutualFriendPreviewName;
  const mutual =
    count > 0 && name ? `${name}님${count === 1 ? '' : ` 외 ${count - 1}명`}과 친구` : null;
  return (
    <>
      <View style={styles.card}>
        <View style={StyleSheet.absoluteFill} pointerEvents="none">
          <Svg width="100%" height="100%">
            <Defs>
              <LinearGradient id="card" x1="0" y1="0" x2="0" y2="1">
                <Stop offset="0" stopColor="#5a8974" stopOpacity={0.2} />
                <Stop offset="1" stopColor="#749c8a" stopOpacity={0.17} />
              </LinearGradient>
            </Defs>
            <Rect width="100%" height="100%" rx={22} fill="url(#card)" />
          </Svg>
        </View>
        <Image
          source={
            user.profileImageUrl && !imageFailed ? { uri: user.profileImageUrl } : searchAvatar
          }
          style={styles.avatar}
          contentFit="cover"
          onError={() => setImageFailed(true)}
        />
        <Text style={styles.name}>{user.displayName || '친구'}</Text>
        {mutual ? <Text style={styles.mutual}>{mutual}</Text> : <View style={{ height: 22 }} />}
        <Pressable
          accessibilityRole="button"
          accessibilityState={{ disabled: requested || pending, busy: pending }}
          disabled={requested || pending}
          onPress={received ? onReceived : () => void send()}
          style={[styles.button, requested && styles.requested, pending && { opacity: 0.5 }]}
        >
          {pending ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text style={styles.buttonText}>
              {requested ? '요청됨' : received ? '받은 요청 확인' : '친구 요청 보내기'}
            </Text>
          )}
        </Pressable>
      </View>
      {error ? (
        <Text style={styles.error} accessibilityLiveRegion="polite">
          {error}
        </Text>
      ) : null}
    </>
  );
}

function SearchQuery({
  email,
  scope,
  onReceived,
  renderFriend,
  empty,
}: {
  email: string;
  scope: AuthQueryScope;
  onReceived: () => void;
  renderFriend: (userId: number) => React.ReactNode;
  empty: React.ReactNode;
}) {
  const client = useQueryClient();
  const options = searchQueryOptions(email, scope);
  // 실패 뒤 Suspense가 재시도 렌더할 때 자동 mount retry로 다시 대기하지 않는다.
  // 새 검색 진입과 명시적 재시도는 상위 영역에서 다시 시작한다.
  const result = useQuery({ ...options, retryOnMount: false });
  const failure =
    result.error && !result.isFetching && !isCancel(result.error) ? result.error : null;
  const requested = result.data?.relationshipStatus === 'PENDING_SENT';
  useEffect(() => {
    if (requested && failure && !missingEmail(failure)) {
      logError(normalizeError(failure), { scope: 'api', operation: 'searchFriendByEmail' });
    }
  }, [failure, requested]);
  if (result.isPending || (result.data === undefined && result.isFetching))
    suspendSearch(client, options);
  const feedback = failure ? (
    <FriendsQueryFeedback error={failure} onRetry={() => void result.refetch()} />
  ) : null;
  if (failure && !requested) {
    if (missingEmail(failure)) return empty;
    throw failure;
  }
  if (!result.data) return feedback;
  return (
    <>
      <SearchResult
        email={email}
        scope={scope}
        user={result.data}
        onReceived={onReceived}
        renderFriend={renderFriend}
      />
      {failure && !missingEmail(failure) ? feedback : null}
    </>
  );
}

export function FriendEmailSearch({
  email,
  scope,
  onReceived,
  renderFriend,
  empty,
}: {
  email: string;
  scope: AuthQueryScope;
  onReceived: () => void;
  renderFriend: (userId: number) => React.ReactNode;
  empty: React.ReactNode;
}) {
  const client = useQueryClient();
  const options = useMemo(() => searchQueryOptions(email, scope), [email, scope]);
  const entered = useRef(false);
  if (!entered.current) {
    entered.current = true;
    const previous = client.getQueryState(options.queryKey);
    // 오류 캐시로 다시 검색한 첫 렌더도 완료 전에는 Suspense에서 기다린다.
    if (previous?.error && previous.data === undefined && isCurrentAuthQueryScope(scope)) {
      void client.prefetchQuery(options);
    }
  }
  return (
    <QueryErrorResetBoundary>
      {({ reset }) => (
        <ErrorBoundary
          shouldLog={(error) => !missingEmail(error)}
          onReset={() => {
            reset();
            void client.resetQueries({ queryKey: options.queryKey, exact: true });
          }}
          fallback={(error, retry) =>
            missingEmail(error) ? empty : <FriendsQueryFeedback error={error} onRetry={retry} />
          }
        >
          <Suspense
            fallback={
              <ActivityIndicator
                style={{ padding: 24 }}
                color="#5a8974"
                accessibilityLabel="이메일 검색 중"
              />
            }
          >
            <SearchQuery
              email={email}
              scope={scope}
              onReceived={onReceived}
              renderFriend={renderFriend}
              empty={empty}
            />
          </Suspense>
        </ErrorBoundary>
      )}
    </QueryErrorResetBoundary>
  );
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: 17,
    height: 281,
    borderRadius: 22,
    alignItems: 'center',
    paddingVertical: 33,
    overflow: 'hidden',
  },
  avatar: { width: 98, height: 98, borderRadius: 49 },
  name: { fontFamily: bold, fontSize: 20, lineHeight: 28, color: '#383e49', marginTop: 7 },
  mutual: { fontFamily: regular, fontSize: 14, lineHeight: 22, color: '#383e49' },
  button: {
    marginTop: 10,
    minWidth: 147,
    height: 44,
    borderRadius: 999,
    paddingHorizontal: 20,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#5a8974',
  },
  requested: { backgroundColor: '#3f6051', opacity: 0.3 },
  buttonText: {
    fontFamily: bold,
    fontSize: 16,
    lineHeight: 24,
    color: 'white',
    letterSpacing: -0.32,
  },
  error: {
    fontFamily: regular,
    fontSize: 14,
    lineHeight: 20,
    color: '#9d4e4e',
    marginHorizontal: 17,
    marginTop: 12,
  },
});
