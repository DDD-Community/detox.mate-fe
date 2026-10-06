import type { FriendReceivedRequestResponse, FriendResponse } from '../../../api/generated/model';

export interface FriendListUser {
  userId: number;
  displayName: string;
  profileImageUrl?: string;
  email?: string;
}

export interface FriendsListItem {
  friendshipId: number;
  user: FriendListUser;
}

export interface FriendReceivedRequest {
  requestId: number;
  user: FriendListUser;
}

export interface FriendsListApi {
  getFriends: () => Promise<FriendResponse[]>;
  getReceivedRequests: () => Promise<FriendReceivedRequestResponse[]>;
  acceptRequest: (requestId: number) => Promise<FriendResponse>;
  deletePendingRequest: (requestId: number) => Promise<void>;
  unfriend: (friendshipId: number) => Promise<void>;
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
    email: user?.email,
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

export interface FriendsListState {
  friends: FriendsListItem[];
  receivedRequests: FriendReceivedRequest[];
  loading: boolean;
  refreshing: boolean;
  error: string | null;
  pendingActionId: string | null;
}
