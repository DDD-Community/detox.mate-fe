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

describe('goBackOrReplace', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('goes back when there is navigation history', () => {
    mockedRouter.canGoBack.mockReturnValue(true);

    goBackOrReplace('/(feed)/home');

    expect(mockedRouter.back).toHaveBeenCalledTimes(1);
    expect(mockedRouter.replace).not.toHaveBeenCalled();
  });

  it('replaces to fallback when there is no navigation history', () => {
    mockedRouter.canGoBack.mockReturnValue(false);

    goBackOrReplace('/(group)/home');

    expect(mockedRouter.back).not.toHaveBeenCalled();
    expect(mockedRouter.replace).toHaveBeenCalledWith('/(group)/home');
  });
});

describe('getVerifyExitRoute', () => {
  it('returns feed home when verifyRoot is feed', () => {
    expect(getVerifyExitRoute('feed')).toBe('/(feed)/home');
  });

  it('returns group home when verifyRoot is omitted', () => {
    expect(getVerifyExitRoute()).toBe('/(group)/home');
  });

  it('returns group home for unsupported verifyRoot values', () => {
    expect(getVerifyExitRoute('mypage')).toBe('/(group)/home');
  });
});
