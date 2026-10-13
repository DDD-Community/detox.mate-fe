import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { CanceledError } from 'axios';

import { getAuthenticatedRequestSignal } from '@/api/client';
import {
  getGetFriendsQueryOptions,
  getGetReceivedRequestsQueryOptions,
  getGetSentRequestsQueryOptions,
} from '@/api/query-generated/friend';
import { useFriendsListController } from '@/screens/friends/hooks/useFriendsListController';
import { useSendFriendRequest } from '@/screens/friends/hooks/useSendFriendRequest';
import type { FriendPageParams, FriendPageRelationship } from '../utils/friendPageParams';

// 친구 페이지의 상태 버튼이 가리키는 관계와 그 관계를 바꾸는 행동을 모은다.
// 서버 쓰기·캐시 반영·성공 로그는 친구 목록의 기존 훅이 맡고 여기서는 화면 상태만 결정한다.
export function useFriendRelationship({
  userId,
  relationship: initial,
  friendshipId,
  requestId,
}: Pick<FriendPageParams, 'userId' | 'relationship' | 'friendshipId' | 'requestId'>) {
  const client = useQueryClient();
  const [local, setLocal] = useState({ relationship: initial, friendshipId, requestId });
  const controller = useFriendsListController();
  const sender = useSendFriendRequest(userId, async () => {
    const session = getAuthenticatedRequestSignal();
    const friendsOptions = getGetFriendsQueryOptions();
    const receivedOptions = getGetReceivedRequestsQueryOptions();
    const sentOptions = getGetSentRequestsQueryOptions();
    await Promise.all(
      [friendsOptions, receivedOptions, sentOptions].map(({ queryKey }) =>
        client.cancelQueries({ queryKey, exact: true })
      )
    );
    if (session.aborted) throw new CanceledError();
    const [friends, received, sent] = await Promise.all([
      client.fetchQuery({ ...friendsOptions, staleTime: 0 }),
      client.fetchQuery({ ...receivedOptions, staleTime: 0 }),
      client.fetchQuery({ ...sentOptions, staleTime: 0 }),
    ]);
    if (session.aborted) throw new CanceledError();
    const friend = friends.find((item) => item.user.userId === userId);
    const incoming = received.find((item) => item.user.userId === userId);
    const outgoing = sent.find((item) => item.user?.userId === userId);
    if (friend)
      setLocal({ relationship: 'FRIEND', friendshipId: friend.friendshipId, requestId: undefined });
    else if (incoming)
      setLocal({
        relationship: 'PENDING_RECEIVED',
        requestId: incoming.requestId,
        friendshipId: undefined,
      });
    else if (outgoing)
      setLocal({
        relationship: 'PENDING_SENT',
        requestId: outgoing.requestId,
        friendshipId: undefined,
      });
    return Boolean(friend || incoming || outgoing);
  });

  // 요청은 한 번 성공하면 대기 상태로 유지한다(취소는 MVP에서 제공하지 않는다).
  const relationship: FriendPageRelationship =
    local.relationship === 'NONE' && sender.completed ? 'PENDING_SENT' : local.relationship;

  const remove = async (): Promise<boolean> => {
    if (local.friendshipId === undefined) return false;
    const removed = await controller.deleteFriend(local.friendshipId);
    if (removed) setLocal({ relationship: 'NONE', friendshipId: undefined, requestId: undefined });
    return removed;
  };

  const accept = async (): Promise<boolean> => {
    if (local.requestId === undefined) return false;
    const accepted = await controller.acceptRequest(local.requestId);
    if (accepted)
      setLocal({ relationship: 'FRIEND', friendshipId: local.requestId, requestId: undefined });
    return accepted;
  };

  return {
    relationship,
    pending: controller.pendingActionId !== null || sender.pending,
    removing: controller.pendingActionId?.startsWith('friend:') ?? false,
    error: controller.error ?? sender.error,
    remove,
    accept,
    send: sender.send,
  };
}
