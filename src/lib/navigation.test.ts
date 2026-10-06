import { router } from 'expo-router';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { getVerifyExitRoute, goBackOrReplace } from './navigation';

vi.mock('expo-router', () => ({
  router: {
    back: vi.fn(),
    canGoBack: vi.fn(),
    replace: vi.fn(),
  },
}));

const mockedRouter = vi.mocked(router);

describe('goBackOrReplace 이전 화면 이동', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('이동 이력이 있으면 이전 화면으로 돌아간다', () => {
    mockedRouter.canGoBack.mockReturnValue(true);

    goBackOrReplace('/(feed)/home');

    expect(mockedRouter.back).toHaveBeenCalledTimes(1);
    expect(mockedRouter.replace).not.toHaveBeenCalled();
  });

  it('이동 이력이 없으면 지정한 대체 경로로 이동한다', () => {
    mockedRouter.canGoBack.mockReturnValue(false);

    goBackOrReplace('/(group)/home');

    expect(mockedRouter.back).not.toHaveBeenCalled();
    expect(mockedRouter.replace).toHaveBeenCalledWith('/(group)/home');
  });
});

describe('getVerifyExitRoute 종료 경로 선택', () => {
  it('verifyRoot가 feed이면 피드 홈 경로를 반환한다', () => {
    expect(getVerifyExitRoute('feed')).toBe('/(feed)/home');
  });

  it('verifyRoot를 생략하면 그룹 홈 경로를 반환한다', () => {
    expect(getVerifyExitRoute()).toBe('/(group)/home');
  });

  it('지원하지 않는 verifyRoot 값이면 그룹 홈 경로를 반환한다', () => {
    expect(getVerifyExitRoute('mypage')).toBe('/(group)/home');
  });
});
