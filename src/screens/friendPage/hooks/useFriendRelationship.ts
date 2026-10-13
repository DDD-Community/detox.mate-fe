import { useState } from 'react';

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
  const [local, setLocal] = useState<FriendPageRelationship>(initial);
  const controller = useFriendsListController();
  const sender = useSendFriendRequest(userId);

  // 요청은 한 번 성공하면 대기 상태로 유지한다(취소는 MVP에서 제공하지 않는다).
  const relationship: FriendPageRelationship =
    local === 'NONE' && sender.completed ? 'PENDING_SENT' : local;

  const remove = async (): Promise<boolean> => {
    if (friendshipId === undefined) return false;
    const removed = await controller.deleteFriend(friendshipId);
    if (removed) setLocal('NONE');
    return removed;
  };

  const accept = async (): Promise<boolean> => {
    if (requestId === undefined) return false;
    const accepted = await controller.acceptRequest(requestId);
    if (accepted) setLocal('FRIEND');
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
