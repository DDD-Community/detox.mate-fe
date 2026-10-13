import { describe, expect, it } from 'vitest';
import type { FriendResponse } from '../../../api/query-generated/model';
import { filterFriendsByName, toFriendListItem } from './friendsListData';
const friend: FriendResponse = {
  friendshipId: 41,
  user: {
    userId: 8,
    displayName: '홍길동',
    userCode: 'ABCDE',
    profileImageUrl: null,
    relationshipStatus: 'FRIEND',
    requestId: null,
  },
  acceptedAt: '2026-10-09T10:00:00',
};
describe('친구 목록 데이터 변환과 검색', () => {
  it('이름을 검색하면 앞뒤 공백과 대소문자를 무시하고 초대코드는 검색 대상에서 제외한다', () => {
    const friends = [
      toFriendListItem(friend),
      toFriendListItem({
        ...friend,
        friendshipId: 44,
        user: { ...friend.user, userId: 10, displayName: 'Alice' },
      }),
    ];
    expect(filterFriendsByName(friends, '  홍길  ')).toEqual([friends[0]]);
    expect(filterFriendsByName(friends, 'aLI')).toEqual([friends[1]]);
    expect(filterFriendsByName(friends, 'ABCDE')).toEqual([]);
    expect(filterFriendsByName(friends, '  ')).toBe(friends);
  });

  it('친구 관계 ID가 없으면 변환을 거부한다', () => {
    expect(
      toFriendListItem({
        ...friend,
        friendshipId: 5,
        user: { ...friend.user, userId: 6, displayName: '이름' },
      }).user.userCode
    ).toBe('ABCDE');
    // @ts-expect-error 필수 관계 ID가 누락된 외부 응답
    expect(() => toFriendListItem({ user: friend.user })).toThrow();
  });
});
