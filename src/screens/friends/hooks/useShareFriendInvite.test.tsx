// @vitest-environment jsdom
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, createElement } from 'react';
import { createRoot } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { useShareFriendInvite } from './useShareFriendInvite';

const actions = vi.hoisted(() => ({
  env: { friendInviteBaseUrl: undefined as string | undefined },
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
vi.mock('../../../config/env', () => ({ env: actions.env }));
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
      ? { code: 'my-invite', email: 'my@example.com' }
      : { userId: 1, displayName: '희정', relationshipStatus: 'SELF' }
  );
  actions.env.friendInviteBaseUrl = 'https://detoxmate.abr.ge/shared-invite?campaign=friends';
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
    '%s에서 공유하면 초대 링크와 이름·이메일을 함께 전달한다',
    async (os) => {
      actions.platform.OS = os;
      const screen = await setup();
      await act(async () => {
        await screen.state.share();
      });
      const content = actions.share.mock.calls[0][0];
      expect(content.message).toContain('희정');
      expect(content.message).toContain('my@example.com');
      expect(os === 'ios' ? content.url : content.message).toContain(
        'https://detoxmate.abr.ge/shared-invite?campaign=friends&friend_invite_code=my-invite'
      );
    }
  );

  it('초대 코드에 쿼리 문자가 있어도 기존 캠페인을 보존하고 현재 코드만 전달한다', async () => {
    const code = 'invite+/=& 한글';
    actions.env.friendInviteBaseUrl =
      'https://detoxmate.abr.ge/shared-invite?campaign=friends%26family&friend_invite_code=old';
    const normalRequest = actions.request.getMockImplementation()!;
    actions.request.mockImplementation((config: { url: string }) =>
      config.url === '/friends/invite'
        ? Promise.resolve({ code, email: 'my@example.com' })
        : normalRequest(config)
    );
    const screen = await setup();
    await act(async () => {
      await screen.state.share();
    });
    const url = new URL(actions.share.mock.calls[0][0].url);
    expect(url.searchParams.get('campaign')).toBe('friends&family');
    expect(url.searchParams.getAll('friend_invite_code')).toEqual([code]);
  });

  it('자동으로 준비한 URL을 표시하고 공유에 재사용하며 실제 클릭만 기록한다', async () => {
    const pending = deferred<{ code: string; email: string }>();
    actions.request.mockReturnValueOnce(pending.promise);
    const screen = await setup();
    expect(actions.track).not.toHaveBeenCalled();
    expect(actions.share).not.toHaveBeenCalled();

    await act(async () => {
      pending.resolve({ code: 'prepared-invite', email: 'my@example.com' });
      await screen.state.share();
    });
    expect(screen.state.inviteUrl).toBe(
      'https://detoxmate.abr.ge/shared-invite?campaign=friends&friend_invite_code=prepared-invite'
    );
    expect(actions.share.mock.calls[0][0].url).toBe(screen.state.inviteUrl);
    await act(async () => {
      await screen.state.share();
    });
    expect(actions.track).toHaveBeenCalledTimes(2);
  });

  it('공유 준비 중 화면을 떠나면 늦게 조회된 초대 정보로 공유하거나 안내하지 않는다', async () => {
    const pending = deferred<{ code: string; email: string }>();
    actions.request.mockReturnValueOnce(pending.promise);
    const screen = await setup();
    let first!: Promise<void>;
    await act(async () => {
      first = screen.state.share();
      screen.unmount();
    });
    await act(async () => {
      pending.resolve({ code: 'old-user', email: 'old@example.com' });
      await first;
    });
    expect(actions.share).not.toHaveBeenCalled();
    expect(actions.alert).not.toHaveBeenCalled();
  });

  it.each([undefined, 'not-a-url', 'http://detoxmate.abr.ge/shared-invite'])(
    '공용 링크가 %s이면 불완전한 공유를 막고 설정 후 다시 준비할 수 있다',
    async (baseUrl) => {
      actions.env.friendInviteBaseUrl = baseUrl;
      const screen = await setup();
      expect(screen.state.inviteUrl).toBeUndefined();
      expect(actions.alert).not.toHaveBeenCalled();
      expect(actions.track).not.toHaveBeenCalled();
      expect(actions.log).toHaveBeenCalledWith(expect.anything(), {
        scope: 'api',
        operation: 'friends.invite.prepare',
      });
      await act(async () => {
        await screen.state.share();
      });
      expect(actions.share).not.toHaveBeenCalled();
      expect(actions.alert).toHaveBeenCalledTimes(1);
      expect(screen.state.sharing).toBe(false);

      actions.env.friendInviteBaseUrl = 'https://detoxmate.abr.ge/shared-invite';
      await act(async () => {
        await screen.state.share();
      });
      expect(actions.share.mock.calls[0][0].url).toBe(screen.state.inviteUrl);
    }
  );

  it('초대 정보 조회 중 세션이 정리되면 이전 사용자의 메시지와 이메일을 공유하지 않는다', async () => {
    const pending = deferred<{ code: string; email: string }>();
    actions.request.mockReturnValueOnce(pending.promise);
    const screen = await setup();
    let first!: Promise<void>;
    await act(async () => {
      first = screen.state.share();
    });
    actions.auth.abort();
    await act(async () => {
      pending.resolve({ code: 'old-user', email: 'old@example.com' });
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
    const pending = deferred<{ action: string }>();
    actions.share.mockReturnValueOnce(pending.promise);
    const screen = await setup();
    let first!: Promise<void>;
    await act(async () => {
      first = screen.state.share();
      await screen.state.share();
    });
    expect(actions.share).toHaveBeenCalledTimes(1);
    expect(actions.log).toHaveBeenCalledWith(expect.anything(), {
      scope: 'api',
      operation: 'logFriendInviteShareClick',
    });
    expect(actions.track).toHaveBeenCalledExactlyOnceWith('Invite Share Button Clicked', {
      page_name: 'FriendsList',
    });
    await act(async () => {
      pending.reject(new Error('공유 실패'));
      await first;
    });
    expect(screen.state.sharing).toBe(false);
    expect(actions.alert).toHaveBeenCalledTimes(1);
    expect(actions.log.mock.calls.map(([, context]) => context.operation)).toEqual([
      'logFriendInviteShareClick',
      'friends.invite.share',
    ]);

    await act(async () => {
      await screen.state.share();
    });
    expect(actions.share).toHaveBeenCalledTimes(2);
    expect(actions.track).toHaveBeenCalledTimes(2);
    expect(actions.alert).toHaveBeenCalledTimes(1);
    expect(screen.state.sharing).toBe(false);
  });

  it.each(['/friends/invite', '/friends/invite/my-invite'])(
    '%s 준비 조회가 실패하면 불완전한 내용을 공유하지 않고 다음 클릭으로 복구한다',
    async (failedUrl) => {
      const pending = deferred<never>();
      const normalRequest = actions.request.getMockImplementation()!;
      actions.request.mockImplementation((config: { url: string }) =>
        config.url === failedUrl ? pending.promise : normalRequest(config)
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
      expect(actions.share.mock.calls[0][0].message).toContain('my@example.com');
    }
  );

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
