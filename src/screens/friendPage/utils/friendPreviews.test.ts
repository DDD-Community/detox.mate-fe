import { describe, expect, it } from 'vitest';
import { selectFriendPreviews } from './friendPreviews';

describe('친구 페이지의 친구 목록 미리보기', () => {
  it('서버가 준 순서를 유지하고 최대 10명만 고른다', () => {
    const friends = Array.from({ length: 12 }, (_, index) => ({ displayName: `친구${index}` }));
    const items = selectFriendPreviews(friends);
    expect(items).toHaveLength(10);
    expect(items[0].displayName).toBe('친구0');
    expect(items[9].displayName).toBe('친구9');
    expect(new Set(items.map((item) => item.key)).size).toBe(10);
  });

  it('이름이 없으면 기본 이름을, 사진이 없으면 null을 쓰고 목록이 없어도 빈 배열이다', () => {
    expect(selectFriendPreviews([{}])).toEqual([
      { key: '0', displayName: '이름 없음', profileImageUrl: null },
    ]);
    expect(selectFriendPreviews(undefined)).toEqual([]);
  });
});
