// @vitest-environment jsdom
import {
  QueryClient,
  QueryClientProvider,
  usePrefetchQuery,
  useSuspenseQuery,
} from '@tanstack/react-query';
import { act, createElement, type ReactNode } from 'react';
import { createRoot } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  getGetFriendsSuspenseQueryOptions,
  getGetReceivedRequestsSuspenseQueryOptions,
} from '../../../api/query-generated/friend';
import type { FriendResponse } from '../../../api/query-generated/model';
import { toFriendListItem, toReceivedRequest } from '../utils/friendsListData';
import { FriendsQuerySection } from './FriendsQuerySection';

const api = vi.hoisted(() => ({ friends: vi.fn(), requests: vi.fn() }));
vi.mock('../../../api/friendMutator', () => ({
  friendAxios: ({ url }: { url: string }) => (url === '/friends' ? api.friends() : api.requests()),
}));
vi.mock('expo-router', () => ({ router: { replace: vi.fn() } }));
vi.mock('expo-constants', () => ({
  default: {
    expoConfig: {
      extra: {
        appEnv: 'development',
        appVersion: 'test',
        buildChannel: 'local',
        apiBaseUrl: 'https://example.test',
        amplitudeApiKey: 'test',
      },
    },
  },
}));
vi.mock('@sentry/react-native', () => ({ captureException: vi.fn() }));
vi.mock('../../../lib/token/icons', () => ({ iconNames: [] }));
vi.mock('react-native', async () => {
  const { createElement } = await import('react');
  return {
    View: ({ children }: { children: ReactNode }) => createElement('div', {}, children),
    Text: ({ children }: { children: ReactNode }) => createElement('span', {}, children),
    Pressable: ({ children, onPress }: { children: ReactNode; onPress: () => void }) =>
      createElement('button', { onClick: onPress }, children),
    ActivityIndicator: ({ accessibilityLabel }: { accessibilityLabel: string }) =>
      createElement('span', { role: 'status' }, accessibilityLabel),
    StyleSheet: { create: (styles: unknown) => styles },
  };
});
Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });

const friend: FriendResponse = {
  friendshipId: 41,
  user: { userId: 8, displayName: '복구된 친구' },
};
const request = { requestId: 72, user: { userId: 9, displayName: '유지할 요청' } };
const cleanups: (() => void)[] = [];

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((res) => {
    resolve = res;
  });
  return { promise, resolve };
}

beforeEach(() => {
  vi.resetAllMocks();
  vi.spyOn(console, 'error').mockImplementation(() => undefined);
  api.requests.mockImplementation(async () => [request]);
});
afterEach(async () => {
  await act(() => cleanups.splice(0).forEach((cleanup) => cleanup()));
  vi.restoreAllMocks();
});

async function setup() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const friendsOptions = getGetFriendsSuspenseQueryOptions();
  const requestsOptions = getGetReceivedRequestsSuspenseQueryOptions();
  function FriendsData() {
    const rows = useSuspenseQuery(friendsOptions).data.map(toFriendListItem);
    return createElement('span', {}, rows.map((row) => row.user.displayName).join(','));
  }
  function RequestsData() {
    const rows = useSuspenseQuery(requestsOptions).data.map(toReceivedRequest);
    return createElement('span', {}, rows.map((row) => row.user.displayName).join(','));
  }
  function Screen() {
    usePrefetchQuery(friendsOptions);
    usePrefetchQuery(requestsOptions);
    return (
      <div>
        <FriendsQuerySection label="친구 목록" queryKey={friendsOptions.queryKey}>
          <FriendsData />
        </FriendsQuerySection>
        <FriendsQuerySection label="받은 요청" queryKey={requestsOptions.queryKey}>
          <RequestsData />
        </FriendsQuerySection>
      </div>
    );
  }
  const container = document.createElement('div');
  const root = createRoot(container);
  cleanups.push(() => {
    root.unmount();
    client.clear();
  });
  await act(async () => {
    root.render(createElement(QueryClientProvider, { client }, createElement(Screen)));
  });
  return {
    container,
    client,
    requestsOptions,
    async retry() {
      const button = container.querySelector('button');
      expect(button).not.toBeNull();
      await act(async () => {
        button!.dispatchEvent(new MouseEvent('click', { bubbles: true }));
      });
    },
  };
}

describe('친구 조회 영역의 오류 복구', () => {
  it('잘못된 성공 응답을 재시도하면 다시 조회하고, 재실패 뒤 복구하면서 다른 영역을 보존한다', async () => {
    api.friends.mockResolvedValueOnce([{ user: friend.user }]);
    const screen = await setup();
    expect(screen.container.querySelector('button')).not.toBeNull();
    expect(screen.container.textContent).toContain(request.user.displayName);
    const requestsData = screen.client.getQueryData(screen.requestsOptions.queryKey);

    const retryRead = deferred<FriendResponse[]>();
    api.friends.mockReturnValueOnce(retryRead.promise);
    await screen.retry();
    expect(screen.container.textContent).toContain('친구 목록 불러오는 중');
    expect(screen.container.textContent).toContain(request.user.displayName);
    await act(async () => {
      retryRead.resolve([{ user: friend.user }]);
    });
    expect(screen.container.querySelector('button')).not.toBeNull();

    api.friends.mockResolvedValueOnce([friend]);
    await screen.retry();
    expect(screen.container.textContent).toContain(friend.user!.displayName);
    expect(screen.container.querySelector('button')).toBeNull();
    expect(screen.client.getQueryData(screen.requestsOptions.queryKey)).toBe(requestsData);
    expect(screen.container.textContent).toContain(request.user.displayName);
  });

  it('초기 조회 실패도 경계 재시도로 다시 조회해 복구한다', async () => {
    api.friends.mockRejectedValueOnce(new Error('offline')).mockResolvedValueOnce([friend]);
    const screen = await setup();
    expect(screen.container.querySelector('button')).not.toBeNull();
    await screen.retry();
    expect(screen.container.textContent).toContain(friend.user!.displayName);
    expect(screen.container.querySelector('button')).toBeNull();
  });
});
