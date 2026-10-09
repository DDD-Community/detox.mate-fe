import type { FriendResponse } from '@/api';

export const PROFILE_NAME_MAX_LENGTH = 5;
export const RECENT_FRIENDS_LIMIT = 10;

// 공백은 입력할 수 없고 5글자를 넘기면 입력이 막힌다. 이모지·특수문자는 허용하므로
// UTF-16 길이가 아니라 코드포인트 기준으로 센다.
export function sanitizeProfileName(input: string): string {
  return Array.from(input.replace(/\s/g, '')).slice(0, PROFILE_NAME_MAX_LENGTH).join('');
}

const toAcceptedTime = (friend: FriendResponse) => {
  const time = friend.acceptedAt ? Date.parse(friend.acceptedAt) : NaN;
  return Number.isNaN(time) ? 0 : time;
};

// 최근 친구 추가순으로 정렬해 상위 10명만 노출한다. 전체는 친구 목록 화면에서 본다.
export function pickRecentFriends(friends: FriendResponse[]): FriendResponse[] {
  return [...friends]
    .sort((a, b) => toAcceptedTime(b) - toAcceptedTime(a))
    .slice(0, RECENT_FRIENDS_LIMIT);
}
