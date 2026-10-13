// @vitest-environment jsdom
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { CanceledError } from 'axios';
import { act, createElement } from 'react';
import { createRoot } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { trackEvent } from '@/lib/analytics';
import { logError } from '@/api/errors/logger';

import { AppError } from '../../../api/errors/normalizeError';
import { cancelAuthenticatedRequests } from '../../../api/client';
import { useSendFriendRequest } from './useSendFriendRequest';

const trackEventMock = vi.mocked(trackEvent);
const logErrorMock = vi.mocked(logError);
const api = vi.hoisted(() => ({ send: vi.fn() }));
vi.mock('../../../lib/analytics');
vi.mock('../../../api/friendMutator', () => ({ friendAxios: () => api.send() }));
vi.mock('../../../api/errors/logger');
vi.mock('../../../api/client');
Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
const cleanups: (() => void)[] = [];
beforeEach(() => vi.resetAllMocks());
afterEach(async () => {
  await act(() => cleanups.splice(0).forEach((cleanup) => cleanup()));
});
async function setup(onConflict = vi.fn().mockResolvedValue(false)) {
  const client = new QueryClient();
  const root = createRoot(document.createElement('div'));
  let current!: ReturnType<typeof useSendFriendRequest>;
  function Content() {
    current = useSendFriendRequest(2, onConflict);
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
  it.each([true, false])(
    '409 후 현재 관계 복구 여부(%s)에 따라 오류를 처리하고 전송 성공으로 기록하지 않는다',
    async (recovered) => {
      const recover = vi.fn().mockResolvedValue(recovered);
      const screen = await setup(recover);
      api.send.mockRejectedValue(AppError({ type: 'conflict', status: 409 }));
      await act(() => screen.state.send());
      await waitForResult(() => {
        expect(screen.state.pending).toBe(false);
        expect(screen.state.completed).toBe(false);
        if (recovered) expect(screen.state.error).toBeNull();
        else expect(screen.state.error).not.toBeNull();
      });
      expect(recover).toHaveBeenCalledOnce();
      expect(trackEventMock).not.toHaveBeenCalled();
    }
  );

  it('충돌 재조회 중에는 중복 전송을 막고 재조회 실패를 숨기지 않는다', async () => {
    let reject!: (error: unknown) => void;
    const reading = new Promise<boolean>((_resolve, rejectRead) => {
      reject = rejectRead;
    });
    const recover = vi.fn().mockReturnValue(reading);
    const screen = await setup(recover);
    api.send.mockRejectedValue(AppError({ type: 'conflict', status: 409 }));
    let sending!: Promise<void>;
    await act(() => {
      sending = screen.state.send();
    });
    await waitForResult(() => expect(recover).toHaveBeenCalledOnce());
    await act(() => screen.state.send());
    expect(api.send).toHaveBeenCalledOnce();
    await act(async () => {
      reject(AppError({ type: 'network' }));
      await sending;
    });
    await waitForResult(() => {
      expect(screen.state.pending).toBe(false);
      expect(screen.state.error).toContain('네트워크');
    });
    expect(trackEventMock).not.toHaveBeenCalled();
  });

  it('이전 계정의 늦은 충돌은 새 계정에서 관계 조회를 시작하지 않는다', async () => {
    let reject!: (error: unknown) => void;
    api.send.mockReturnValue(
      new Promise((_resolve, rejectSend) => {
        reject = rejectSend;
      })
    );
    const recover = vi.fn();
    const screen = await setup(recover);
    let sending!: Promise<void>;
    await act(() => {
      sending = screen.state.send();
    });
    cancelAuthenticatedRequests();
    await act(async () => {
      reject(AppError({ type: 'conflict', status: 409 }));
      await sending;
    });
    expect(recover).not.toHaveBeenCalled();
    expect(screen.state.error).toBeNull();
  });

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
