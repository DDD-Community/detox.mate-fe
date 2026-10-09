export const UNREGISTER_REASONS = [
  '목표(시험 등) 달성으로 제한할 필요가 없어요',
  '시간을 지키기 힘들어요.',
  '습관이 자리 잡았어요.',
  '기타',
] as const;

/**
 * 그룹 친구 목록 연동 전까지 쓰는 목업 친구 풀.
 * 실제 연동 시 그룹 멤버 목록으로 대체된다.
 */
export const MOCK_FRIEND_POOL = ['한빈', '지민', '서연', '도윤', '하은'] as const;

export const pickRandomFriendNames = (count = 3): string[] =>
  [...MOCK_FRIEND_POOL].sort(() => Math.random() - 0.5).slice(0, count);
