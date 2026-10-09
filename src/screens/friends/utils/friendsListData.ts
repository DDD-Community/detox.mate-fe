import type {
  FriendReceivedRequestResponse,
  FriendResponse,
} from '../../../api/query-generated/model';

export interface FriendListUser {
  userId: number;
  displayName: string;
  profileImageUrl?: string;
  userCode: string;
}

export interface FriendsListItem {
  friendshipId: number;
  user: FriendListUser;
}

export interface FriendReceivedRequest {
  requestId: number;
  user: FriendListUser;
}

export function requireId(value: number | undefined): number {
  if (!Number.isSafeInteger(value) || value == null || value <= 0) {
    throw new Error('친구 정보를 불러오지 못했어요. 다시 시도해주세요.');
  }
  return value;
}

function toUser(user: FriendResponse['user']): FriendListUser {
  return {
    userId: requireId(user?.userId),
    displayName: user?.displayName ?? '이름 없음',
    profileImageUrl: user?.profileImageUrl,
    userCode: user!.userCode,
  };
}

export function toFriendListItem(friend: FriendResponse): FriendsListItem {
  return { friendshipId: requireId(friend.friendshipId), user: toUser(friend.user) };
}

export function toReceivedRequest(request: FriendReceivedRequestResponse): FriendReceivedRequest {
  return { requestId: requireId(request.requestId), user: toUser(request.user) };
}

export function filterFriendsByName(friends: FriendsListItem[], query: string): FriendsListItem[] {
  const name = query.trim().toLocaleLowerCase();
  if (!name) return friends;
  return friends.filter((friend) => friend.user.displayName.toLocaleLowerCase().includes(name));
}
