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
  platform: { OS: 'ios' },
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
  friendAxios: async ({ url }: { url: string }) =>
    url === '/friends/invite'
      ? { code: 'my-invite', email: 'my@example.com' }
      : { userId: 1, displayName: '희정', relationshipStatus: 'SELF' },
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
  actions.createLink.mockResolvedValue('https://detoxmate.airbridge.io/test-invite');
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
        'https://detoxmate.airbridge.io/test-invite'
      );
    }
  );

  it('링크 생성 중 세션이 정리되면 이전 사용자의 메시지와 이메일을 공유하지 않는다', async () => {
    const pending = deferred<string>();
    actions.createLink.mockReturnValueOnce(pending.promise);
    const screen = await setup();
    let first!: Promise<void>;
    await act(async () => {
      first = screen.state.share();
    });
    screen.client.clear();
    await act(async () => {
      pending.resolve('https://detoxmate.airbridge.io/old-user');
      await first;
    });
    expect(actions.share).not.toHaveBeenCalled();
    expect(actions.alert).not.toHaveBeenCalled();
    expect(screen.state.sharing).toBe(false);
  });

  it('연속 공유는 한 번만 시작하며 실패 후 재시도와 공유창 취소는 정상 종료된다', async () => {
    const pending = deferred<string>();
    actions.createLink.mockReturnValueOnce(pending.promise);
    const screen = await setup();
    let first!: Promise<void>;
    await act(async () => {
      first = screen.state.share();
      await screen.state.share();
    });
    expect(actions.createLink).toHaveBeenCalledTimes(1);
    expect(actions.track).toHaveBeenCalledExactlyOnceWith('Invite Share Button Clicked', {
      page_name: 'FriendsList',
    });
    await act(async () => {
      pending.reject(new Error('링크 생성 실패'));
      await first;
    });
    expect(screen.state.sharing).toBe(false);
    expect(actions.alert).toHaveBeenCalledTimes(1);

    await act(async () => {
      await screen.state.share();
    });
    expect(actions.share).toHaveBeenCalledTimes(1);
    expect(actions.track).toHaveBeenCalledTimes(2);
    expect(actions.alert).toHaveBeenCalledTimes(1);
    expect(screen.state.sharing).toBe(false);
  });
});
