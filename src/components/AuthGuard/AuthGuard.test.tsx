// @vitest-environment jsdom
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, createElement, type PropsWithChildren } from 'react';
import { createRoot } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { customAxios } from '@/api/mutator';
import { getMyProfileQueryOptions } from '@/api/userQueries';
import { useAuthSessionStore } from '@/stores/authSessionStore';
import { AuthGuard } from './AuthGuard';

vi.mock('@/api/mutator');
vi.mock('expo-secure-store');
vi.mock('../AppErrorBoundary/AppErrorBoundary', () => ({
  ErrorBoundary: ({ children }: PropsWithChildren) => children,
}));
vi.mock('react-native', () => ({
  View: ({ children }: PropsWithChildren) => children,
  ActivityIndicator: () => '인증 확인 중',
}));
Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });

let container: HTMLDivElement;
let root: ReturnType<typeof createRoot>;
let client: QueryClient;
const profile = {
  id: 1,
  displayName: '이전 계정',
  userCode: 'ABCDE',
  profileImageUrl: null,
  pushNotificationEnabled: false,
};
const mount = () =>
  act(() => {
    root.render(
      createElement(QueryClientProvider, { client }, createElement(AuthGuard, {}, '계정 화면'))
    );
  });

beforeEach(() => {
  vi.resetAllMocks();
  container = document.createElement('div');
  root = createRoot(container);
  client = new QueryClient({ defaultOptions: { queries: { retry: false, staleTime: Infinity } } });
  useAuthSessionStore.setState({ status: 'authenticated' });
});
afterEach(async () => {
  await act(() => root.unmount());
  client.clear();
});

describe('계정 화면의 접근 Guard', () => {
  it('저장된 프로필이 최신 상태여도 재진입하면 서버에 다시 확인한다', async () => {
    client.setQueryData(getMyProfileQueryOptions().queryKey, profile);
    vi.mocked(customAxios).mockResolvedValue(profile);
    await mount();
    expect(customAxios).toHaveBeenCalled();
    await act(() => root.render(null));
    vi.mocked(customAxios).mockClear();
    await mount();
    expect(customAxios).toHaveBeenCalled();
  });

  it('캐시가 남아 있어도 세션이 끝나면 이미 열린 계정 화면과 재진입을 차단한다', async () => {
    client.setQueryData(getMyProfileQueryOptions().queryKey, profile);
    vi.mocked(customAxios).mockResolvedValue(profile);
    await mount();
    expect(container.textContent).toBe('계정 화면');
    await act(() => useAuthSessionStore.setState({ status: 'unauthenticated' }));
    expect(container.textContent).toBe('');
    await act(() => root.render(null));
    await mount();
    expect(container.textContent).toBe('');
  });

  it('프로필을 확인하기 전에는 계정 화면을 노출하지 않는다', async () => {
    const response = Promise.withResolvers<typeof profile>();
    vi.mocked(customAxios).mockReturnValue(response.promise);
    await mount();
    expect(container.textContent).toBe('인증 확인 중');
    await act(async () => response.resolve(profile));
    expect(container.textContent).toBe('계정 화면');
  });
});
