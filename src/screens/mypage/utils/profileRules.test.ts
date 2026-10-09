import { describe, expect, it } from 'vitest';
import { pickRecentFriends, sanitizeProfileName } from './profileRules';

describe('프로필 이름 입력 규칙', () => {
  it('공백은 제거하고 이모지와 특수문자는 유지한 채 5글자까지만 남긴다', () => {
    expect(sanitizeProfileName(' 홍 길 동 ')).toBe('홍길동');
    expect(sanitizeProfileName('가나다라마바')).toBe('가나다라마');
    expect(sanitizeProfileName('😀😀😀😀😀😀')).toBe('😀😀😀😀😀');
    expect(sanitizeProfileName('a!@#$%')).toBe('a!@#$');
  });
});

describe('마이페이지 친구 미리보기', () => {
  it('친구 추가가 최근인 순서로 정렬해 최대 10명만 고른다', () => {
    const friends = Array.from({ length: 12 }, (_, index) => ({
      friendshipId: index + 1,
      acceptedAt: new Date(2026, 0, index + 1).toISOString(),
    }));
    const picked = pickRecentFriends(friends);
    expect(picked).toHaveLength(10);
    expect(picked[0].friendshipId).toBe(12);
    expect(picked[9].friendshipId).toBe(3);
  });

  it('친구 추가 시각이 없으면 가장 뒤로 보낸다', () => {
    const picked = pickRecentFriends([
      { friendshipId: 1 },
      { friendshipId: 2, acceptedAt: '2026-01-01T00:00:00Z' },
    ]);
    expect(picked.map((friend) => friend.friendshipId)).toEqual([2, 1]);
  });
});
