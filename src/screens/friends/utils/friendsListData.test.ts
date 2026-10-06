import { describe, expect, it } from 'vitest';
import { filterFriendsByName, toFriendListItem } from './friendsListData';
const friend = {
  friendshipId: 41,
  user: { userId: 8, displayName: '홍길동', email: 'gil@example.com' },
};
describe('friend list data', () => {
  it('searches only names, trims spaces and handles case without matching an email', () => {
    const friends = [
      toFriendListItem(friend),
      toFriendListItem({ friendshipId: 44, user: { userId: 10, displayName: 'Alice' } }),
    ];
    expect(filterFriendsByName(friends, '  홍길  ')).toEqual([friends[0]]);
    expect(filterFriendsByName(friends, 'aLI')).toEqual([friends[1]]);
    expect(filterFriendsByName(friends, 'gil@example.com')).toEqual([]);
    expect(filterFriendsByName(friends, '  ')).toBe(friends);
  });

  it('keeps optional email absent and refuses a missing relationship ID', () => {
    expect(
      toFriendListItem({ friendshipId: 5, user: { userId: 6, displayName: '이름' } }).user.email
    ).toBeUndefined();
    expect(() => toFriendListItem({ user: { userId: 6 } })).toThrow();
  });
});
