import { describe, expect, it } from 'vitest';
import { filterFriendsByName, toFriendListItem } from './friendsListData';
const friend = {
  friendshipId: 41,
  user: { userId: 8, displayName: '홍길동', email: 'gil@example.com' },
};
describe('친구 목록 데이터 변환과 검색', () => {
  it('이름을 검색하면 앞뒤 공백과 대소문자를 무시하고 이메일은 검색 대상에서 제외한다', () => {
    const friends = [
      toFriendListItem(friend),
      toFriendListItem({ friendshipId: 44, user: { userId: 10, displayName: 'Alice' } }),
    ];
    expect(filterFriendsByName(friends, '  홍길  ')).toEqual([friends[0]]);
    expect(filterFriendsByName(friends, 'aLI')).toEqual([friends[1]]);
    expect(filterFriendsByName(friends, 'gil@example.com')).toEqual([]);
    expect(filterFriendsByName(friends, '  ')).toBe(friends);
  });

  it('이메일이 없으면 그대로 유지하고 친구 관계 ID가 없으면 변환을 거부한다', () => {
    expect(
      toFriendListItem({ friendshipId: 5, user: { userId: 6, displayName: '이름' } }).user.email
    ).toBeUndefined();
    expect(() => toFriendListItem({ user: { userId: 6 } })).toThrow();
  });
});
