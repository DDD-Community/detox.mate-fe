// @vitest-environment jsdom
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, createElement } from 'react';
import { createRoot } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { trackEvent } from '@/lib/analytics';
import { logError } from '@/api/errors/logger';

import { useShareFriendInvite } from './useShareFriendInvite';

const trackEventMock = vi.mocked(trackEvent);
const logErrorMock = vi.mocked(logError);
const actions = vi.hoisted(() => ({
  share: vi.fn(),
  alert: vi.fn(),
  request: vi.fn(),
  platform: { OS: 'ios' },
  auth: new AbortController(),
}));
vi.mock('../../../api/client', () => ({
  getAuthenticatedRequestSignal: () => actions.auth.signal,
}));
vi.mock('react-native', () => ({
  Share: { share: actions.share },
  Alert: { alert: actions.alert },
  Platform: actions.platform,
}));
vi.mock('../../../api/errors/logger');
vi.mock('../../../api/friendMutator', () => ({
  friendAxios: actions.request,
}));

vi.mock('../../../lib/analytics');
// airbridge.ts는 expo-router와 네이티브 SDK를 끌어오므로 링크 만드는 함수만 실제 구현을 쓴다.
vi.mock('../../../lib/airbridge', () => ({
  getFriendInviteShareUrl: (code: string) =>
    `https://detoxmatedev.airbridge.io/friend-invite?code=${encodeURIComponent(code)}`,
}));

Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
const cleanups: (() => void)[] = [];

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (failure: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

beforeEach(() => {
  vi.resetAllMocks();
  actions.platform.OS = 'ios';
  actions.auth = new AbortController();
  actions.request.mockResolvedValue({ code: 'my-invite', userCode: 'ABCDE' });
  actions.share.mockResolvedValue({ action: 'dismissedAction' });
});
afterEach(async () => {
  await act(() => cleanups.splice(0).forEach((cleanup) => cleanup()));
});

async function setup(options?: Parameters<typeof useShareFriendInvite>[0]) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  let current!: ReturnType<typeof useShareFriendInvite>;
  function Harness() {
    current = useShareFriendInvite(options);
    return null;
  }
  const root = createRoot(document.createElement('div'));
  cleanups.push(() => {
    root.unmount();
    client.clear();
  });
  await act(() => {
    root.render(createElement(QueryClientProvider, { client }, createElement(Harness)));
  });
  return {
    unmount: () => root.unmount(),
    client,
    get state() {
      return current;
    },
  };
}

describe('친구 초대 공유의 비동기 보호', () => {
  it.each(['ios', 'android'])(
    '%s에서 사용자 코드와 Airbridge 링크를 전달하고 내부 초대 토큰과 이메일은 제외한다',
    async (os) => {
      actions.platform.OS = os;
      actions.request.mockResolvedValue({
        code: 'my-invite',
        userCode: 'ABCDE',
        email: 'my@example.com',
      });
      const screen = await setup();
      await act(async () => {
        await screen.state.share();
      });
      const content = actions.share.mock.calls[0][0];
      expect(content.message).toContain('초대 코드: ABCDE');
      expect(content.message).not.toContain('my-invite');
      expect(content.message).toContain('https://detoxmatedev.airbridge.io/friend-invite?code=ABCDE');
      expect(content.message).toContain('친구 목록 검색창에 초대 코드를 입력해주세요.');
      expect(content.message).not.toContain('이메일');
      expect(content.message).not.toContain('my@example.com');
      expect(content).not.toHaveProperty('url');
    }
  );

  it('자동으로 준비한 카드 문구를 표시하고 공유에 재사용하며 실제 클릭만 기록한다', async () => {
    const pending = deferred<{ code: string; userCode: string }>();
    actions.request.mockReturnValueOnce(pending.promise);
    const screen = await setup();
    expect(trackEventMock).not.toHaveBeenCalled();
    expect(actions.share).not.toHaveBeenCalled();

    await act(async () => {
      pending.resolve({ code: 'internal-code', userCode: 'PREP1' });
      await screen.state.share();
    });
    expect(screen.state.inviteLabel).toBe('detoxmate/PREP1');
    expect(actions.share.mock.calls[0][0].message).toContain('초대 코드: PREP1');
    await act(async () => {
      await screen.state.share();
    });
    expect(trackEventMock).toHaveBeenCalledTimes(2);
  });

  it('미리 준비하지 않는 화면은 진입 시 조회하지 않고 공유 클릭 후 코드를 전달한다', async () => {
    const screen = await setup({ prepareOnMount: false });
    expect(actions.request).not.toHaveBeenCalled();
    expect(screen.state.inviteLabel).toBeUndefined();
    expect(actions.share).not.toHaveBeenCalled();

    await act(async () => {
      await screen.state.share();
    });
    expect(actions.share).toHaveBeenCalledTimes(1);
    expect(actions.share.mock.calls[0][0].message).toContain('초대 코드: ABCDE');
  });

  it('공유 준비 중 화면을 떠나면 늦게 조회된 초대 정보로 공유하거나 안내하지 않는다', async () => {
    const pending = deferred<{ code: string; userCode: string }>();
    actions.request.mockReturnValueOnce(pending.promise);
    const screen = await setup();
    let first!: Promise<void>;
    await act(async () => {
      first = screen.state.share();
      screen.unmount();
    });
    await act(async () => {
      pending.resolve({ code: 'old-user', userCode: 'OLD12' });
      await first;
    });
    expect(actions.share).not.toHaveBeenCalled();
    expect(actions.alert).not.toHaveBeenCalled();
  });

  it('초대 코드가 비어 있으면 불완전한 공유를 막고 안내한다', async () => {
    actions.request.mockResolvedValue({ code: 'internal-code', userCode: ' ' });
    const screen = await setup();
    expect(screen.state.inviteLabel).toBeUndefined();
    expect(trackEventMock).not.toHaveBeenCalled();
    expect(logErrorMock).toHaveBeenCalledWith(expect.anything(), {
      scope: 'api',
      operation: 'friends.invite.prepare',
    });
    await act(async () => {
      await screen.state.share();
    });
    expect(actions.share).not.toHaveBeenCalled();
    expect(actions.alert).toHaveBeenCalledTimes(1);
    expect(screen.state.sharing).toBe(false);
  });

  it('초대 정보 조회 중 세션이 정리되면 이전 사용자의 메시지와 코드를 공유하지 않는다', async () => {
    const pending = deferred<{ code: string; userCode: string }>();
    actions.request.mockReturnValueOnce(pending.promise);
    const screen = await setup();
    let first!: Promise<void>;
    await act(async () => {
      first = screen.state.share();
    });
    actions.auth.abort();
    await act(async () => {
      pending.resolve({ code: 'old-user', userCode: 'OLD12' });
      await first;
    });
    expect(actions.share).not.toHaveBeenCalled();
    expect(actions.alert).not.toHaveBeenCalled();
    expect(screen.state.sharing).toBe(false);
  });

  it('분석 로그가 실패해도 연속 공유를 막고 공유 실패 후 재시도와 취소가 정상 종료된다', async () => {
    trackEventMock.mockImplementationOnce(() => {
      throw new Error('분석 기록 실패');
    });
    const pending = deferred<{ action: string }>();
    actions.share.mockReturnValueOnce(pending.promise);
    const screen = await setup();
    let first!: Promise<void>;
    await act(async () => {
      first = screen.state.share();
      await screen.state.share();
    });
    expect(actions.share).toHaveBeenCalledTimes(1);
    expect(logErrorMock).toHaveBeenCalledWith(expect.anything(), {
      scope: 'api',
      operation: 'logFriendInviteShareClick',
    });
    expect(trackEventMock).toHaveBeenCalledExactlyOnceWith('Invite Share Button Clicked', {
      page_name: 'FriendsList',
    });
    await act(async () => {
      pending.reject(new Error('공유 실패'));
      await first;
    });
    expect(screen.state.sharing).toBe(false);
    expect(actions.alert).toHaveBeenCalledTimes(1);
    expect(logErrorMock.mock.calls.map(([, context]) => context?.operation)).toEqual([
      'logFriendInviteShareClick',
      'friends.invite.share',
    ]);

    await act(async () => {
      await screen.state.share();
    });
    expect(actions.share).toHaveBeenCalledTimes(2);
    expect(trackEventMock).toHaveBeenCalledTimes(2);
    expect(actions.alert).toHaveBeenCalledTimes(1);
    expect(screen.state.sharing).toBe(false);
  });

  it('초대 정보 조회가 실패하면 불완전한 내용을 공유하지 않고 다음 클릭으로 복구한다', async () => {
    const pending = deferred<never>();
    actions.request.mockReturnValueOnce(pending.promise);
    const screen = await setup();
    let first!: Promise<void>;
    await act(async () => {
      first = screen.state.share();
    });
    await act(async () => {
      pending.reject(new Error('초대 정보 조회 실패'));
      await first;
    });
    expect(actions.share).not.toHaveBeenCalled();
    expect(actions.alert).toHaveBeenCalledTimes(1);
    expect(screen.state.sharing).toBe(false);
    await act(async () => {
      await screen.state.share();
    });
    expect(actions.share.mock.calls[0][0].message).toContain('초대 코드: ABCDE');
  });

  it('공유 시트가 실패하면 안내 후 다음 공유를 다시 실행할 수 있다', async () => {
    actions.share.mockRejectedValueOnce(new Error('공유 시트 실패'));
    const screen = await setup();
    await act(async () => {
      await screen.state.share();
    });
    expect(actions.alert).toHaveBeenCalledTimes(1);
    expect(logErrorMock).toHaveBeenCalledExactlyOnceWith(expect.anything(), {
      scope: 'api',
      operation: 'friends.invite.share',
    });
    expect(screen.state.sharing).toBe(false);
    await act(async () => {
      await screen.state.share();
    });
    expect(actions.share).toHaveBeenCalledTimes(2);
    expect(actions.alert).toHaveBeenCalledTimes(1);
    expect(screen.state.sharing).toBe(false);
  });
});
