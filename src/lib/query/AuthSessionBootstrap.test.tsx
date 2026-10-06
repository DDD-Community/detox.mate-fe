// @vitest-environment jsdom
import { act, createElement, useEffect, type ReactNode } from 'react';
import { createRoot } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({ read: vi.fn(), hide: vi.fn(), log: vi.fn() }));
vi.mock('expo-secure-store', () => ({ getItemAsync: mocks.read }));
vi.mock('expo-splash-screen', () => ({ hideAsync: mocks.hide }));
vi.mock('expo-router', () => ({ router: { replace: vi.fn() } }));
vi.mock('../../api/errors/logger', () => ({ logError: mocks.log }));
vi.mock('../../lib/token/icons', () => ({ iconNames: [] }));
vi.mock('react-native', async () => {
  const { createElement } = await import('react');
  return {
    View: ({ children }: { children: ReactNode }) => createElement('div', {}, children),
    Text: ({ children }: { children: ReactNode }) => createElement('span', {}, children),
    Pressable: ({ children, onPress }: { children: ReactNode; onPress: () => void }) =>
      createElement('button', { onClick: onPress }, children),
    StyleSheet: { create: (styles: unknown) => styles },
  };
});
Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
const cleanups: (() => void)[] = [];
beforeEach(() => {
  vi.resetModules();
  vi.resetAllMocks();
  mocks.hide.mockResolvedValue(undefined);
});
afterEach(async () => {
  await act(() => cleanups.splice(0).forEach((cleanup) => cleanup()));
});

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

async function mount(entry = '/friends') {
  const auth = await import('./authQueryScope');
  const { AuthSessionBootstrap } = await import('./AuthSessionBootstrap');
  const mounted = vi.fn();
  function Route() {
    const scope = auth.useAuthQueryScope();
    useEffect(() => {
      mounted(scope.userId);
    }, [scope]);
    return createElement('span', {}, `${entry}:${scope.userId ?? 'guest'}`);
  }
  const element = document.createElement('div');
  const caught = vi.fn();
  const root = createRoot(element, { onCaughtError: caught });
  cleanups.push(() => root.unmount());
  await act(() =>
    root.render(
      <AuthSessionBootstrap>
        <Route />
      </AuthSessionBootstrap>
    )
  );
  return { auth, mounted, caught, element };
}

describe('공통 인증 복원과 라우트 진입', () => {
  it.each(['/', '/friends'])(
    '%s 진입은 인증 복원이 끝난 뒤 저장된 사용자로 화면을 마운트하고 네이티브 스플래시를 닫는다',
    async (entry) => {
      const token = deferred<string | null>();
      const userId = deferred<string | null>();
      mocks.read.mockImplementation((key) =>
        key === 'accessTokenKey' ? token.promise : userId.promise
      );
      const screen = await mount(entry);
      expect(screen.mounted).not.toHaveBeenCalled();
      await act(async () => {
        userId.resolve('stored-user');
        await userId.promise;
      });
      expect(screen.mounted).not.toHaveBeenCalled();
      await act(async () => {
        token.resolve('token');
        await token.promise;
      });
      expect(screen.element.textContent).toBe(`${entry}:stored-user`);
      expect(screen.mounted.mock.calls).toEqual([['stored-user']]);
      expect(mocks.hide).toHaveBeenCalled();
      expect(mocks.log).not.toHaveBeenCalled();
    }
  );

  it.each([
    ['로그인', '완료', 'new-user'],
    ['로그아웃', '완료', null],
    ['로그인', '실패', 'new-user'],
    ['로그아웃', '실패', null],
  ] as const)(
    '복원 중 새 %s 뒤 저장소 조회가 %s해도 현재 세션과 화면을 보존한다',
    async (_transition, outcome, userId) => {
      const stored = deferred<string | null>();
      mocks.read.mockImplementation((key) =>
        key === 'accessTokenKey' ? Promise.resolve('token') : stored.promise
      );
      const screen = await mount();
      await act(async () => {
        screen.auth.changeAuthQueryScope(userId);
        if (outcome === '완료') stored.resolve('old-user');
        else stored.reject(new Error('storage unavailable'));
        await stored.promise.catch(() => undefined);
      });
      expect(screen.auth.getAuthQueryScope().userId).toBe(userId);
      expect(screen.element.textContent).toBe(`/friends:${userId ?? 'guest'}`);
      expect(screen.caught).not.toHaveBeenCalled();
      expect(mocks.log).not.toHaveBeenCalled();
    }
  );

  it('저장소 실패는 공통 경계에서 한 번 기록하고 재시도하면 실제 복원 뒤 화면에 진입한다', async () => {
    mocks.read.mockRejectedValue(new Error('storage unavailable'));
    const screen = await mount();
    expect(screen.element.textContent).toContain('다시 시도');
    expect(screen.mounted).not.toHaveBeenCalled();
    expect(mocks.hide).toHaveBeenCalled();
    expect(mocks.log).toHaveBeenCalledTimes(1);
    expect(mocks.log).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ scope: 'render', componentStack: expect.any(String) })
    );

    const retry = deferred<string | null>();
    mocks.read.mockImplementation((key) =>
      key === 'accessTokenKey' ? Promise.resolve('token') : retry.promise
    );
    const button = Array.from(screen.element.querySelectorAll('button')).find(
      (item) => item.textContent === '다시 시도'
    );
    await act(() => button!.click());
    expect(screen.mounted).not.toHaveBeenCalled();
    await act(async () => {
      retry.resolve('restored-user');
      await retry.promise;
    });
    expect(screen.element.textContent).toBe('/friends:restored-user');
    expect(mocks.log).toHaveBeenCalledTimes(1);
  });

  it('토큰이 없으면 저장된 사용자 ID만으로 세션을 복원하지 않고 미로그인 화면으로 진입한다', async () => {
    mocks.read.mockImplementation(async (key) => (key === 'accessTokenKey' ? null : 'stale-user'));
    const screen = await mount();
    expect(screen.auth.getAuthQueryScope().userId).toBeNull();
    expect(screen.element.textContent).toBe('/friends:guest');
    expect(mocks.log).not.toHaveBeenCalled();
  });
});
