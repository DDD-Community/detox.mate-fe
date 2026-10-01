import { Redirect, useLocalSearchParams } from 'expo-router';
import { useEffect, useState, useSyncExternalStore } from 'react';
import { Alert } from 'react-native';

import type { FriendResponse, FriendReceivedRequestResponse } from '../../src/api/generated/model';
import {
  createFriendsListStore,
  type FriendsListApi,
} from '../../src/features/friends/friendsListData';
import { FriendsListView } from '../../src/screens/friends/FriendsListView';

// This route exercises the production view and store without changing any real relationship.
// It is inaccessible in release builds; fixture values are never used by FriendsScreen.
export default function FriendsPreviewRoute() {
  const { state = 'base' } = useLocalSearchParams<{ state?: string }>();
  if (!__DEV__) return <Redirect href="/" />;
  return <FriendsPreview key={state} scenario={state} />;
}

function FriendsPreview({ scenario }: { scenario: string }) {
  const [store] = useState(() => {
    const names =
      scenario === 'search'
        ? ['홍길동', '홍길동', '홍길동', '김하늘', '이민수', '박지수']
        : scenario === 'noresults'
          ? ['김하늘', '이민수', '박지수']
          : Array(6).fill('홍길동');
    let friends: FriendResponse[] =
      scenario === 'empty'
        ? []
        : names.map((displayName, i) => ({
            friendshipId: i + 100,
            user: { userId: i + 200, displayName, email: 'email.com' },
          }));
    if (scenario === 'long')
      friends = Array.from({ length: 40 }, (_, i) => ({
        friendshipId: i + 100,
        user: {
          userId: i + 200,
          displayName: `친구 ${i + 1}`,
          email: `friend${i + 1}@example.com`,
        },
      }));
    let received: FriendReceivedRequestResponse[] = [
      'received',
      'delete',
      'failDelete',
      'failReject',
      'failAccept',
    ].includes(scenario)
      ? [{ requestId: 300, user: { userId: 400, displayName: '홍길동', email: 'email.com' } }]
      : [];
    const api: FriendsListApi = {
      getFriends: async () => {
        if (scenario === 'error')
          throw new Error('친구 목록을 불러오지 못했어요. 다시 시도해주세요.');
        return [...friends];
      },
      getReceivedRequests: async () => [...received],
      acceptRequest: async (id) => {
        if (scenario === 'failAccept')
          throw new Error('요청을 수락하지 못했어요. 다시 시도해주세요.');
        const request = received.find((item) => item.requestId === id);
        if (!request) throw new Error('이미 처리된 요청이에요.');
        const accepted = { friendshipId: 900, user: request.user };
        received = received.filter((item) => item.requestId !== id);
        friends = [...friends, accepted];
        return accepted;
      },
      deletePendingRequest: async (id) => {
        if (scenario === 'failReject')
          throw new Error('요청을 거절하지 못했어요. 다시 시도해주세요.');
        received = received.filter((item) => item.requestId !== id);
      },
      unfriend: async (id) => {
        if (scenario === 'failDelete')
          throw new Error('친구를 삭제하지 못했어요. 다시 시도해주세요.');
        friends = friends.filter((item) => item.friendshipId !== id);
      },
    };
    return createFriendsListStore(api, (error) =>
      error instanceof Error ? error.message : '다시 시도해주세요.'
    );
  });
  const snapshot = useSyncExternalStore(store.subscribe, store.getSnapshot, store.getSnapshot);
  useEffect(() => {
    void store.refresh();
    return store.cancelRefresh;
  }, [store]);
  return (
    <FriendsListView
      {...snapshot}
      onRefresh={store.refresh}
      onAccept={store.acceptRequest}
      onReject={store.rejectRequest}
      onDelete={store.deleteFriend}
      onShare={() =>
        Alert.alert(
          '친구 초대 링크는 준비 중이에요.',
          '공유 기능은 초대 화면과 함께 연결할 예정이에요.'
        )
      }
      initialQuery={scenario === 'search' ? '홍길' : scenario === 'noresults' ? '홍길동' : ''}
      autoFocusSearch={scenario === 'search' || scenario === 'noresults'}
      initialDeleteFriendId={scenario === 'delete' || scenario === 'failDelete' ? 100 : undefined}
    />
  );
}
