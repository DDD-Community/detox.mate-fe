import { setupServer } from 'msw/node';
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';

import { FRIENDS_MOCK_ORIGIN, friendsHandlers, resetFriendsMockData } from './friendsHandlers';

type FriendPayload = {
  friendshipId: number;
  user: { userId: number; displayName: string; email: string; profileImageUrl: string | null };
};
type RequestPayload = {
  requestId: number;
  user: { requestId: number; relationshipStatus: string };
};

const server = setupServer(...friendsHandlers);
const request = (path: string, method = 'GET') =>
  fetch(`${FRIENDS_MOCK_ORIGIN}${path}`, { method });
const read = async (path: string) => (await request(path)).json();

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
beforeEach(() => resetFriendsMockData({ latencyMs: 0 }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe('Swagger friends MSW HTTP contract', () => {
  it('returns distinct realistic users, nullable photos and separate relationship IDs', async () => {
    const friends = await read('/friends');
    const received = await read('/friends/requests/received');
    expect(friends).toHaveLength(8);
    expect(received).toHaveLength(3);
    expect(new Set(friends.map((friend: FriendPayload) => friend.user.displayName)).size).toBe(8);
    expect(
      friends.every((friend: FriendPayload) => friend.user.email.endsWith('@example.com'))
    ).toBe(true);
    expect(friends.some((friend: FriendPayload) => friend.user.profileImageUrl === null)).toBe(
      true
    );
    expect(
      friends.some((friend: FriendPayload) => friend.user.profileImageUrl?.startsWith('data:'))
    ).toBe(true);
    expect(received[0].user).toMatchObject({
      relationshipStatus: 'PENDING_RECEIVED',
      requestId: 3001,
    });
    expect(friends[0].user).toMatchObject({ relationshipStatus: 'FRIEND', requestId: null });
    expect(friends[0].friendshipId).not.toBe(friends[0].user.userId);
  });

  it('accepts through HTTP, then subsequent reads preserve the new friendship', async () => {
    const response = await request('/friends/requests/3001/accept', 'POST');
    expect(response.status).toBe(200);
    const accepted = await response.json();
    expect(accepted).toMatchObject({
      friendshipId: 2101,
      user: { userId: 1101, displayName: '오유진', relationshipStatus: 'FRIEND', requestId: null },
    });
    expect(Number.isNaN(Date.parse(accepted.acceptedAt))).toBe(false);
    expect(await read('/friends')).toHaveLength(9);
    expect((await read('/friends'))[0]).toEqual(accepted);
    expect(await read('/friends/requests/received')).toHaveLength(2);
    for (const [path, method] of [
      ['/friends/requests/3001/accept', 'POST'],
      ['/friends/requests/3001', 'DELETE'],
    ]) {
      const duplicate = await request(path, method);
      expect(duplicate.status).toBe(409);
      expect(await duplicate.json()).toEqual({
        code: 'CONFLICT',
        message: 'Conflict',
        status: 409,
      });
    }
  });

  it('serializes duplicate acceptance into one friendship and one conflict', async () => {
    const responses = await Promise.all([
      request('/friends/requests/3001/accept', 'POST'),
      request('/friends/requests/3001/accept', 'POST'),
    ]);
    expect(responses.map((response) => response.status).sort()).toEqual([200, 409]);
    expect(await read('/friends')).toHaveLength(9);
    expect(await read('/friends/requests/received')).toHaveLength(2);
  });

  it('limits every handler to the development API origin', () => {
    expect(friendsHandlers).toHaveLength(5);
    for (const handler of friendsHandlers) {
      expect(handler.info.path).toEqual(
        expect.stringMatching(/^https:\/\/api-dev\.detoxmate\.co\.kr\/friends/)
      );
    }
  });

  it('rejects a pending request with 204 without adding a friendship', async () => {
    const response = await request('/friends/requests/3002', 'DELETE');
    expect(response.status).toBe(204);
    expect(await response.text()).toBe('');
    expect(await read('/friends')).toHaveLength(8);
    expect(
      (await read('/friends/requests/received')).map((item: RequestPayload) => item.requestId)
    ).toEqual([3001, 3003]);
    expect((await request('/friends/requests/3002', 'DELETE')).status).toBe(404);
  });

  it('deletes only the specified friendship and preserves incoming requests', async () => {
    const response = await request('/friends/2003', 'DELETE');
    expect(response.status).toBe(204);
    expect(await response.text()).toBe('');
    const friends = await read('/friends');
    expect(friends).toHaveLength(7);
    expect(friends.some((friend: FriendPayload) => friend.friendshipId === 2003)).toBe(false);
    expect(await read('/friends/requests/received')).toHaveLength(3);
    expect((await request('/friends/2003', 'DELETE')).status).toBe(404);
    expect((await request('/friends/3001', 'DELETE')).status).toBe(404);
  });

  it.each([
    ['/friends/99999', 'DELETE'],
    ['/friends/requests/99999', 'DELETE'],
    ['/friends/requests/99999/accept', 'POST'],
  ])('returns the Swagger NOT_FOUND shape for %s', async (path, method) => {
    const response = await request(path, method);
    expect(response.status).toBe(404);
    expect(await response.json()).toEqual({ code: 'NOT_FOUND', message: 'Not Found', status: 404 });
    expect(await read('/friends')).toHaveLength(8);
    expect(await read('/friends/requests/received')).toHaveLength(3);
  });

  it('resets mutations and the next relationship ID for repeatable simulator runs', async () => {
    await request('/friends/requests/3001/accept', 'POST');
    await request('/friends/2001', 'DELETE');
    resetFriendsMockData({ latencyMs: 0 });
    expect(await read('/friends')).toHaveLength(8);
    expect(await read('/friends/requests/received')).toHaveLength(3);
    expect(
      (await (await request('/friends/requests/3001/accept', 'POST')).json()).friendshipId
    ).toBe(2101);
  });
});
