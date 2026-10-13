// @vitest-environment jsdom
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { CanceledError } from 'axios';
import { act, createElement } from 'react';
import { createRoot } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { trackEvent } from '@/lib/analytics';
import { logError } from '@/api/errors/logger';

import { useSendFriendRequest } from './useSendFriendRequest';

const trackEventMock = vi.mocked(trackEvent);
const logErrorMock = vi.mocked(logError);
const api = vi.hoisted(() => ({ send: vi.fn() }));
vi.mock('../../../lib/analytics');
vi.mock('../../../api/friendMutator', () => ({ friendAxios: () => api.send() }));
vi.mock('../../../api/errors/logger');
Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
const cleanups: (() => void)[] = [];
beforeEach(() => vi.resetAllMocks());
afterEach(async () => {
  await act(() => cleanups.splice(0).forEach((cleanup) => cleanup()));
});
async function setup() {
  const client = new QueryClient();
  const root = createRoot(document.createElement('div'));
  let current!: ReturnType<typeof useSendFriendRequest>;
  function Content() {
    current = useSendFriendRequest(2);
    return null;
  }
  await act(() =>
    root.render(createElement(QueryClientProvider, { client }, createElement(Content)))
  );
  cleanups.push(() => {
    root.unmount();
    client.clear();
  });
  return {
    get state() {
      return current;
    },
  };
}
async function waitForResult(assertion: () => void) {
  await vi.waitFor(async () => {
    await act(async () => {});
    assertion();
  });
}

describe('현재 방문의 친구 요청 전송 결과', () => {
  it.each(['실패', '취소'] as const)(
    '%s한 요청은 성공 기록 없이 다시 보낼 수 있다',
    async (outcome) => {
      const screen = await setup();
      api.send.mockRejectedValueOnce(
        outcome === '취소' ? new CanceledError() : new Error('offline')
      );
      await act(() => screen.state.send());
      await waitForResult(() => {
        expect(screen.state.pending).toBe(false);
        expect(screen.state.completed).toBe(false);
        if (outcome === '취소') expect(screen.state.error).toBeNull();
        else expect(screen.state.error).not.toBeNull();
      });
      expect(trackEventMock).not.toHaveBeenCalled();
      // POST 오류 기록은 공통 API 계층에서 처리해 훅에서 중복하지 않는다.
      expect(logErrorMock).not.toHaveBeenCalled();
      api.send.mockResolvedValueOnce({ requestId: 10 });
      await act(() => screen.state.send());
      await waitForResult(() => {
        expect(screen.state.completed).toBe(true);
        expect(screen.state.error).toBeNull();
      });
      expect(trackEventMock.mock.calls).toEqual([['Friend Request Sent']]);
    }
  );

  it('분석 기록이 실패해도 성공한 전송은 완료로 유지된다', async () => {
    const screen = await setup();
    api.send.mockResolvedValueOnce({ requestId: 10 });
    trackEventMock.mockImplementationOnce(() => {
      throw new Error('analytics unavailable');
    });
    await act(() => screen.state.send());
    await waitForResult(() => {
      expect(screen.state.completed).toBe(true);
      expect(screen.state.pending).toBe(false);
      expect(screen.state.error).toBeNull();
    });
    expect(trackEventMock.mock.calls).toEqual([['Friend Request Sent']]);
    expect(logErrorMock).toHaveBeenCalledWith(expect.anything(), {
      scope: 'api',
      operation: 'logFriendRequestSent',
    });
  });
});
