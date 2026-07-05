import { router } from 'expo-router';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { goBackOrReplace } from './navigation';

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
