// @vitest-environment jsdom
import { act, createElement } from 'react';
import { createRoot } from 'react-dom/client';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { useSaveGoalTime } from './useSaveGoalTime';
const mocks = vi.hoisted(() => ({ write: vi.fn(), confirm: vi.fn() }));
vi.mock('@/api/generated/time-limit/time-limit', () => ({
  getTimeLimit: () => ({ set: mocks.write }),
}));
vi.mock('@/stores/lockStore', () => ({
  useLockStore: { getState: () => ({ confirmTargetMinutes: mocks.confirm }) },
}));
vi.mock('@/lib/analytics', () => ({ trackEvent: vi.fn() }));
vi.mock('@/api/errors', () => ({
  handleRequestError: (error: unknown) => ({
    error,
    presentation: 'silent',
    message: '다시 시도해 주세요.',
  }),
  logError: vi.fn(),
}));
Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
const cleanups: (() => void)[] = [];
beforeEach(() => vi.resetAllMocks());
afterEach(async () => {
  await act(() => cleanups.splice(0).forEach((cleanup) => cleanup()));
});
it('저장 실패는 로컬을 바꾸지 않으며 재시도한 0분 저장 성공 이후에만 완료한다', async () => {
  let state!: ReturnType<typeof useSaveGoalTime>;
  function Harness() {
    state = useSaveGoalTime('onboarding');
    return null;
  }
  const root = createRoot(document.createElement('div'));
  cleanups.push(() => root.unmount());
  await act(() => root.render(createElement(Harness)));
  const first = Promise.withResolvers<void>();
  mocks.write.mockReturnValueOnce(first.promise);
  let saving!: Promise<boolean>;
  await act(() => {
    saving = state.save(120);
  });
  let duplicate!: boolean;
  await act(async () => {
    duplicate = await state.save(120);
  });
  expect(duplicate).toBe(false);
  expect(mocks.write).toHaveBeenCalledTimes(1);
  expect(mocks.confirm).not.toHaveBeenCalled();
  await act(async () => {
    first.reject(new Error('저장 실패'));
    expect(await saving).toBe(false);
  });
  expect(state.pending).toBe(false);
  expect(state.errorMessage).toBeTruthy();
  expect(mocks.confirm).not.toHaveBeenCalled();
  mocks.write.mockResolvedValueOnce(undefined);
  await act(async () => {
    expect(await state.save(0)).toBe(true);
  });
  expect(mocks.confirm).toHaveBeenCalledWith(0);
  expect(state.errorMessage).toBeNull();
});
