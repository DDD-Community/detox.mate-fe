import { describe, expect, it } from 'vitest';
import { parseFriendPageParams } from './friendPageParams';

describe('친구 페이지 진입 파라미터', () => {
  it('관계를 모르는 진입은 친구로 보고 비어 있는 프로필 사진은 null로 둔다', () => {
    expect(
      parseFriendPageParams({ userId: '7', displayName: ' 서연 ', friendshipId: '41' })
    ).toEqual({
      userId: 7,
      displayName: '서연',
      profileImageUrl: null,
      relationship: 'FRIEND',
      friendshipId: 41,
      requestId: undefined,
    });
  });

  it('사용자 ID나 이름이 올바르지 않으면 화면을 만들 수 없도록 거부한다', () => {
    expect(parseFriendPageParams({ displayName: '서연' })).toBeNull();
    expect(parseFriendPageParams({ userId: '0', displayName: '서연' })).toBeNull();
    expect(parseFriendPageParams({ userId: 'abc', displayName: '서연' })).toBeNull();
    expect(parseFriendPageParams({ userId: '7', displayName: '  ' })).toBeNull();
  });

  it('알 수 없는 관계 값은 친구로 취급하지 않고 수락 대기 관계와 요청 ID를 유지한다', () => {
    expect(
      parseFriendPageParams({
        userId: ['7'],
        displayName: '서연',
        relationshipStatus: 'PENDING_RECEIVED',
        requestId: '9',
      })
    ).toMatchObject({ relationship: 'PENDING_RECEIVED', requestId: 9 });
    expect(
      parseFriendPageParams({ userId: '7', displayName: '서연', relationshipStatus: 'SELF' })
        ?.relationship
    ).toBe('FRIEND');
  });
});
