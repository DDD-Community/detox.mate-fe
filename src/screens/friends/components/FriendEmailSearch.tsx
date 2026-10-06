import {
  QueryErrorResetBoundary,
  useQueryClient,
  useSuspenseQuery,
  type Query,
} from '@tanstack/react-query';
import { isCancel } from 'axios';
import { Image } from 'expo-image';
import { Suspense, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';

import {
  FriendSearchResponseRelationshipStatus as RelationshipStatus,
  type FriendSearchResponse,
} from '../../../api/query-generated/model';
import { logError, normalizeError } from '../../../api/errors';
import { requireId } from '../utils/friendsListData';
import { ErrorBoundary } from '../../../components/AppErrorBoundary/AppErrorBoundary';
import { useAuthQueryScope } from '../../../lib/query/authQueryScope';
import { fontFamily } from '../../../lib/token/primitive/fonts';
import { useSendFriendRequest } from '../hooks/useSendFriendRequest';
import { searchQueryOptions } from '../utils/friendsQueryOptions';
import { FriendsErrorFeedback } from './FriendsErrorFeedback';
import searchAvatar from '@assets/avatars/friend-search.svg';

const { regular, bold } = fontFamily.primary;
const missingEmail = (error: unknown) => {
  const normalized = normalizeError(error);
  return normalized.status === 404 && normalized.code === 'NOT_FOUND';
};

function SearchResult({
  email,
  onReceived,
  renderFriend,
  user,
}: {
  email: string;
  user: FriendSearchResponse;
  onReceived: () => void;
  renderFriend: (userId: number) => React.ReactNode;
}) {
  const { send, pending, error } = useSendFriendRequest(email, user);
  const [imageFailed, setImageFailed] = useState(false);
  useEffect(() => setImageFailed(false), [user.profileImageUrl]);
  const requested = user.relationshipStatus === RelationshipStatus.PENDING_SENT;
  const received = user.relationshipStatus === RelationshipStatus.PENDING_RECEIVED;
  requireId(user.userId);
  if (
    !user.relationshipStatus ||
    !Object.values(RelationshipStatus).includes(user.relationshipStatus)
  ) {
    throw new Error('친구 정보를 불러오지 못했어요. 다시 시도해주세요.');
  }
  if (user.relationshipStatus === RelationshipStatus.FRIEND) return renderFriend(user.userId!);
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
  onReceived,
  renderFriend,
  empty,
}: {
  email: string;
  onReceived: () => void;
  renderFriend: (userId: number) => React.ReactNode;
  empty: React.ReactNode;
}) {
  const scope = useAuthQueryScope();
  const result = useSuspenseQuery(searchQueryOptions(email, scope));
  const failure =
    result.error && !result.isFetching && !isCancel(result.error) ? result.error : null;
  const requested = result.data?.relationshipStatus === RelationshipStatus.PENDING_SENT;
  useEffect(() => {
    if (failure && !missingEmail(failure)) {
      logError(normalizeError(failure), { scope: 'api', operation: 'searchFriendByEmail' });
    }
  }, [failure]);
  const feedback = failure ? (
    <FriendsErrorFeedback error={failure} onRetry={() => void result.refetch()} />
  ) : null;
  if (failure && !requested) {
    return missingEmail(failure) ? empty : feedback;
  }
  return (
    <>
      <SearchResult
        email={email}
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
  onRefresh,
  onReceived,
  renderFriend,
  empty,
}: {
  email: string;
  onRefresh: () => Promise<void>;
  onReceived: () => void;
  renderFriend: (userId: number) => React.ReactNode;
  empty: React.ReactNode;
}) {
  const scope = useAuthQueryScope();
  const client = useQueryClient();
  const options = searchQueryOptions(email, scope);
  const mountedQuery = useRef<Query | null>(null);
  useEffect(() => {
    const queryKey = searchQueryOptions(email, scope).queryKey;
    const query = client.getQueryCache().find({ queryKey, exact: true });
    mountedQuery.current = query ?? null;
    return () => {
      mountedQuery.current = null;
      // StrictMode immediately restores the same visit; wait before removing its pending query.
      queueMicrotask(() => {
        if (mountedQuery.current === query) return;
        // Also discard an unfinished read so its late failure cannot trap the next visit.
        const current = client.getQueryCache().find({ queryKey, exact: true });
        if (
          current &&
          current === query &&
          current.state.data === undefined &&
          current.getObserversCount() === 0
        )
          client.removeQueries({ queryKey, exact: true });
      });
    };
  }, [client, email, scope]);
  return (
    <QueryErrorResetBoundary>
      {({ reset }) => (
        <ErrorBoundary
          onReset={async () => {
            await onRefresh();
            reset();
            await client.resetQueries({ queryKey: options.queryKey, exact: true });
          }}
          shouldLogError={(error) => !missingEmail(error)}
          fallback={(error) => (missingEmail(error) ? empty : undefined)}
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
