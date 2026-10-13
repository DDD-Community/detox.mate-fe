import type { FriendPreview } from '@/api';

export const FRIEND_PREVIEW_LIMIT = 10;

export interface FriendPreviewItem {
  key: string;
  displayName: string;
  profileImageUrl: string | null;
}

// 서버는 최근 친구 추가순으로 정렬해 주지만 개수는 제한하지 않는다. 정책상 상위 10명만 보여준다.
// 항목은 이름·사진만 있어 서로 구분할 ID가 없으므로 순서를 key로 쓴다.
export function selectFriendPreviews(friends: FriendPreview[] | undefined): FriendPreviewItem[] {
  return (friends ?? []).slice(0, FRIEND_PREVIEW_LIMIT).map((friend, index) => ({
    key: String(index),
    displayName: friend.displayName ?? '이름 없음',
    profileImageUrl: friend.profileImageUrl ?? null,
  }));
}
