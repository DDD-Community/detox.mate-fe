// @vitest-environment jsdom
import { act, createElement } from 'react';
import { createRoot } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { useFriendRelationship } from './useFriendRelationship';

const mocks = vi.hoisted(() => ({
  deleteFriend: vi.fn(),
  acceptRequest: vi.fn(),
  send: vi.fn(),
  sender: { pending: false, completed: false, error: null as string | null },
  controller: { pendingActionId: null as string | null, error: null as string | null },
}));

vi.mock('@/screens/friends/hooks/useFriendsListController', () => ({
  useFriendsListController: () => ({
    ...mocks.controller,
    deleteFriend: mocks.deleteFriend,
    acceptRequest: mocks.acceptRequest,
  }),
}));
vi.mock('@/screens/friends/hooks/useSendFriendRequest', () => ({
  useSendFriendRequest: () => ({ ...mocks.sender, send: mocks.send }),
}));

Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
const cleanups: (() => void)[] = [];

beforeEach(() => {
  vi.resetAllMocks();
  mocks.sender = { pending: false, completed: false, error: null };
  mocks.controller = { pendingActionId: null, error: null };
});
afterEach(async () => {
  await act(() => cleanups.splice(0).forEach((cleanup) => cleanup()));
});

async function setup(options: Parameters<typeof useFriendRelationship>[0]) {
  let current!: ReturnType<typeof useFriendRelationship>;
  let rerender!: () => void;
  const root = createRoot(document.createElement('div'));
  function Harness() {
    current = useFriendRelationship(options);
    return null;
  }
  rerender = () => root.render(createElement(Harness));
  cleanups.push(() => root.unmount());
  await act(() => rerender());
  return {
    get state() {
      return current;
    },
    rerender: () => act(() => rerender()),
  };
}

describe('친구 페이지 관계 상태', () => {
  it('친구 삭제가 확정되면 요청 보내기 상태가 되고, 삭제에 실패하면 친구로 남는다', async () => {
    mocks.deleteFriend.mockResolvedValueOnce(false).mockResolvedValueOnce(true);
    const screen = await setup({ userId: 7, relationship: 'FRIEND', friendshipId: 41 });

    await act(async () => {
      expect(await screen.state.remove()).toBe(false);
    });
    expect(screen.state.relationship).toBe('FRIEND');

    await act(async () => {
      expect(await screen.state.remove()).toBe(true);
    });
    expect(mocks.deleteFriend).toHaveBeenCalledWith(41);
    expect(screen.state.relationship).toBe('NONE');
  });

  it('친구 관계 ID가 없으면 서버에 쓰지 않고 삭제하지 않는다', async () => {
    const screen = await setup({ userId: 7, relationship: 'FRIEND' });
    await act(async () => {
      expect(await screen.state.remove()).toBe(false);
    });
    expect(mocks.deleteFriend).not.toHaveBeenCalled();
    expect(screen.state.relationship).toBe('FRIEND');
  });

  it('요청 보내기가 성공하면 요청됨 상태가 유지된다', async () => {
    const screen = await setup({ userId: 7, relationship: 'NONE' });
    expect(screen.state.relationship).toBe('NONE');

    mocks.sender.completed = true;
    await screen.rerender();
    expect(screen.state.relationship).toBe('PENDING_SENT');
  });

  it('받은 요청 수락이 성공해야 친구가 되고, 실패하면 수락 대기로 남는다', async () => {
    mocks.acceptRequest.mockResolvedValueOnce(false).mockResolvedValueOnce(true);
    const screen = await setup({ userId: 7, relationship: 'PENDING_RECEIVED', requestId: 9 });

    await act(async () => {
      expect(await screen.state.accept()).toBe(false);
    });
    expect(screen.state.relationship).toBe('PENDING_RECEIVED');

    await act(async () => {
      expect(await screen.state.accept()).toBe(true);
    });
    expect(mocks.acceptRequest).toHaveBeenCalledWith(9);
    expect(screen.state.relationship).toBe('FRIEND');
  });

  it('진행 중인 쓰기가 있으면 대기 상태이고 친구 삭제 진행만 삭제 중으로 구분한다', async () => {
    mocks.controller.pendingActionId = 'friend:41';
    const screen = await setup({ userId: 7, relationship: 'FRIEND', friendshipId: 41 });
    expect(screen.state.pending).toBe(true);
    expect(screen.state.removing).toBe(true);

    mocks.controller.pendingActionId = 'request:9';
    await screen.rerender();
    expect(screen.state.pending).toBe(true);
    expect(screen.state.removing).toBe(false);
  });
});
