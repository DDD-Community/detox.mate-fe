import { describe, expect, it } from 'vitest';

import { changeAuthQueryScope, getAuthQueryScope, restoreAuthQueryScope } from './authQueryScope';

describe('인증 복원과 세션 전환', () => {
  it('새 로그인 뒤 늦은 이전 사용자 복원이 도착해도 현재 사용자와 세션을 보존한다', () => {
    const initial = getAuthQueryScope();
    changeAuthQueryScope('new-user');
    const loggedIn = getAuthQueryScope();
    restoreAuthQueryScope('old-user', initial);
    expect(getAuthQueryScope()).toEqual(loggedIn);
    expect(getAuthQueryScope().userId).toBe('new-user');
  });

  it('로그아웃 직후 저장소 삭제가 늦어도 남은 사용자 값으로 종료한 세션을 되살리지 않는다', () => {
    changeAuthQueryScope('old-user');
    changeAuthQueryScope(null);
    const loggedOut = getAuthQueryScope();
    restoreAuthQueryScope('old-user', loggedOut);
    expect(getAuthQueryScope().userId).toBeNull();
  });
});
