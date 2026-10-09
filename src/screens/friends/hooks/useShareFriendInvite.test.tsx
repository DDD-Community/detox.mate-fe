// @vitest-environment jsdom
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, createElement } from 'react';
import { createRoot } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { useShareFriendInvite } from './useShareFriendInvite';

const actions = vi.hoisted(() => ({
  createLink: vi.fn(),
  share: vi.fn(),
  alert: vi.fn(),
  log: vi.fn(),
  track: vi.fn(),
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
vi.mock('../../../lib/friendInviteShare', () => ({
  createFriendInviteShareUrl: actions.createLink,
}));
vi.mock('../../../api/errors/logger', () => ({ logError: actions.log }));
vi.mock('../../../api/friendMutator', () => ({
  friendAxios: actions.request,
}));

vi.mock('../../../lib/analytics', () => ({ trackEvent: actions.track }));

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
  actions.request.mockImplementation(async ({ url }: { url: string }) =>
    url === '/friends/invite'
      ? { code: 'a'.repeat(64), userCode: 'ABCDE' }
      : { userId: 1, displayName: '희정', relationshipStatus: 'SELF' }
  );
  actions.createLink.mockResolvedValue('https://abr.ge/test-invite');
  actions.share.mockResolvedValue({ action: 'dismissedAction' });
});
afterEach(async () => {
  await act(() => cleanups.splice(0).forEach((cleanup) => cleanup()));
});

async function setup() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  let current!: ReturnType<typeof useShareFriendInvite>;
  function Harness() {
    current = useShareFriendInvite();
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
    '%s에서 이메일 유무와 무관하게 표시한 링크·코드를 공유하고 이메일은 제외한다',
    async (os) => {
      actions.platform.OS = os;
      actions.request.mockResolvedValue({
        code: 'a'.repeat(64),
        userCode: 'ABCDE',
        email: os === 'ios' ? 'my@example.com' : undefined,
      });
      const screen = await setup();
      await act(async () => {
        await screen.state.share();
      });
      const content = actions.share.mock.calls[0][0];
      expect(content.message).toContain('초대 코드: ABCDE');
      expect(content.message).not.toContain('a'.repeat(64));
      expect(actions.createLink).toHaveBeenCalledWith('a'.repeat(64));
      expect(content.message).toContain('친구 목록 검색창에 초대 코드를 입력해주세요.');
      expect(content.message).not.toContain('이메일');
      expect(content.message).not.toContain('my@example.com');
      expect(content.message).toContain(screen.state.inviteUrl);
      expect(os === 'ios' ? content.url : content.message).toContain('https://abr.ge/test-invite');
    }
  );

  it('자동으로 준비한 URL을 표시하고 공유에 재사용하며 실제 클릭만 기록한다', async () => {
    const pending = deferred<string>();
    actions.createLink.mockReturnValueOnce(pending.promise);
    const screen = await setup();
    expect(actions.track).not.toHaveBeenCalled();
    expect(actions.share).not.toHaveBeenCalled();

    await act(async () => {
      pending.resolve('https://abr.ge/prepared-invite');
      await screen.state.share();
    });
    expect(screen.state.inviteUrl).toBe('https://abr.ge/prepared-invite');
    expect(actions.share.mock.calls[0][0].url).toBe(screen.state.inviteUrl);
    await act(async () => {
      await screen.state.share();
    });
    expect(actions.createLink).toHaveBeenCalledTimes(1);
    expect(actions.track).toHaveBeenCalledTimes(2);
  });

  it('공유 준비 중 화면을 떠나면 늦게 생성된 URL로 공유하거나 안내하지 않는다', async () => {
    const pending = deferred<string>();
    actions.createLink.mockReturnValueOnce(pending.promise);
    const screen = await setup();
    let first!: Promise<void>;
    await act(async () => {
      first = screen.state.share();
      screen.unmount();
    });
    await act(async () => {
      pending.resolve('https://abr.ge/old-user');
      await first;
    });
    expect(actions.share).not.toHaveBeenCalled();
    expect(actions.alert).not.toHaveBeenCalled();
  });

  it('자동 준비 실패를 기록하고 이후 공유 클릭으로 링크를 다시 준비할 수 있다', async () => {
    const pending = deferred<string>();
    actions.createLink.mockReturnValueOnce(pending.promise);
    const screen = await setup();
    await act(async () => {
      pending.reject(new Error('링크 생성 실패'));
      await pending.promise.catch(() => undefined);
    });
    expect(screen.state.inviteUrl).toBeUndefined();
    expect(actions.alert).not.toHaveBeenCalled();
    expect(actions.track).not.toHaveBeenCalled();
    expect(actions.log).toHaveBeenCalledExactlyOnceWith(expect.anything(), {
      scope: 'api',
      operation: 'friends.invite.prepare',
    });
    await act(async () => {
      await screen.state.share();
    });
    expect(actions.share.mock.calls[0][0].url).toBe(screen.state.inviteUrl);
    expect(screen.state.sharing).toBe(false);
  });

  it('링크 생성 중 세션이 정리되면 이전 사용자의 메시지와 코드를 공유하지 않는다', async () => {
    const pending = deferred<string>();
    actions.createLink.mockReturnValueOnce(pending.promise);
    const screen = await setup();
    let first!: Promise<void>;
    await act(async () => {
      first = screen.state.share();
    });
    actions.auth.abort();
    await act(async () => {
      pending.resolve('https://detoxmate.airbridge.io/old-user');
      await first;
    });
    expect(actions.share).not.toHaveBeenCalled();
    expect(actions.alert).not.toHaveBeenCalled();
    expect(screen.state.sharing).toBe(false);
  });

  it('분석 로그가 실패해도 연속 공유를 막고 공유 실패 후 재시도와 취소가 정상 종료된다', async () => {
    actions.track.mockImplementationOnce(() => {
      throw new Error('분석 기록 실패');
    });
    const pending = deferred<string>();
    actions.createLink.mockReturnValueOnce(pending.promise);
    const screen = await setup();
    let first!: Promise<void>;
    await act(async () => {
      first = screen.state.share();
      await screen.state.share();
    });
    expect(actions.createLink).toHaveBeenCalledTimes(1);
    expect(actions.log).toHaveBeenCalledWith(expect.anything(), {
      scope: 'api',
      operation: 'logFriendInviteShareClick',
    });
    expect(actions.track).toHaveBeenCalledExactlyOnceWith('Invite Share Button Clicked', {
      page_name: 'FriendsList',
    });
    await act(async () => {
      pending.reject(new Error('링크 생성 실패'));
      await first;
    });
    expect(screen.state.sharing).toBe(false);
    expect(actions.alert).toHaveBeenCalledTimes(1);
    expect(actions.log.mock.calls.map(([, context]) => context.operation)).toEqual([
      'logFriendInviteShareClick',
      'friends.invite.prepare',
    ]);

    await act(async () => {
      await screen.state.share();
    });
    expect(actions.share).toHaveBeenCalledTimes(1);
    expect(actions.track).toHaveBeenCalledTimes(2);
    expect(actions.alert).toHaveBeenCalledTimes(1);
    expect(screen.state.sharing).toBe(false);
  });

  it('초대 코드 조회가 실패하면 불완전한 내용을 공유하지 않고 다음 클릭으로 복구한다', async () => {
    const pending = deferred<never>();
    const normalRequest = actions.request.getMockImplementation()!;
    actions.request.mockImplementation((config: { url: string }) =>
      config.url === '/friends/invite' ? pending.promise : normalRequest(config)
    );
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
    actions.request.mockImplementation(normalRequest);
    await act(async () => {
      await screen.state.share();
    });
    expect(actions.share.mock.calls[0][0].url).toBe(screen.state.inviteUrl);
    expect(actions.share.mock.calls[0][0].message).toContain('초대 코드: ABCDE');
  });

  it('공유 시트가 실패하면 안내 후 다음 공유를 다시 실행할 수 있다', async () => {
    actions.share.mockRejectedValueOnce(new Error('공유 시트 실패'));
    const screen = await setup();
    await act(async () => {
      await screen.state.share();
    });
    expect(actions.alert).toHaveBeenCalledTimes(1);
    expect(actions.log).toHaveBeenCalledExactlyOnceWith(expect.anything(), {
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
