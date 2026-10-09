import { describe, expect, it } from 'vitest';

import { findDeselectedAppIds } from './lockSelectionDiff';

const registered = { insta: 'token-insta', youtube: 'token-youtube', kakao: 'token-kakao' };

// 최종 선택 문자열에 앱 토큰 이름이 들어 있으면 겹치는 것으로 본다.
const overlaps = (registeredToken: string, selectionToken: string) =>
  selectionToken.includes(registeredToken);

describe('앱 선택 화면에서 체크 해제된 앱 찾기', () => {
  it('최종 선택에서 하나만 빠지면 → 그 앱만 해제 대상이다', () => {
    expect(findDeselectedAppIds(registered, 'token-insta+token-kakao', overlaps)).toEqual([
      'youtube',
    ]);
  });

  it('선택이 그대로면 → 해제 대상이 없다', () => {
    expect(
      findDeselectedAppIds(registered, 'token-insta+token-youtube+token-kakao', overlaps)
    ).toEqual([]);
  });

  it('최종 선택이 비어 있으면 → 등록된 앱 전부가 해제 대상이다', () => {
    expect(findDeselectedAppIds(registered, null, overlaps)).toEqual(['insta', 'youtube', 'kakao']);
  });

  it('등록된 앱이 없으면 → 선택이 비어 있어도 해제 대상이 없다', () => {
    expect(findDeselectedAppIds({}, null, overlaps)).toEqual([]);
  });
});
