import { http } from 'msw/core/http';

import type {
  FriendListUserResponse,
  FriendReceivedRequestResponse,
  FriendResponse,
} from '../api/query-generated/model';

export const FRIENDS_MOCK_ORIGIN = 'https://api-dev.detoxmate.co.kr';

// The published Swagger examples include nulls omitted by the generated OpenAPI types.
type MockUser = Omit<FriendListUserResponse, 'profileImageUrl' | 'requestId'> & {
  profileImageUrl: string | null;
  requestId: number | null;
};
type MockFriend = Omit<FriendResponse, 'user' | 'friendshipId'> & {
  friendshipId: number;
  user: MockUser;
};
type MockRequest = Omit<FriendReceivedRequestResponse, 'user'> & { user: MockUser };

// Offline avatars keep the simulator independent of external image hosts.
const avatar = (background: string, foreground: string) =>
  `data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="120" height="120" viewBox="0 0 120 120"><rect width="120" height="120" rx="60" fill="${background}"/><circle cx="60" cy="44" r="22" fill="${foreground}"/><ellipse cx="60" cy="104" rx="40" ry="34" fill="${foreground}"/></svg>`)}`;

const friendSeeds = [
  ['김서연', 'seoyeon.kim', avatar('#E7DCD0', '#A77B62')],
  ['이준호', 'junho.lee', null],
  ['박민지', 'minji.park', avatar('#D8E8E3', '#5B8C7B')],
  ['최도윤', 'doyoon.choi', null],
  ['정수빈', 'subin.jeong', null],
  ['한지우', 'jiwoo.han', avatar('#DDE3EF', '#7A89A8')],
  ['윤하린', 'harin.yoon', null],
  ['강현우', 'hyunwoo.kang', null],
] as const;
const requestSeeds = [
  ['오유진', 'yujin.oh', avatar('#F0E2E5', '#B58391')],
  ['임수아', 'sua.lim', null],
  ['백지훈', 'jihoon.baek', null],
] as const;

let friends: MockFriend[] = [];
let requests: MockRequest[] = [];
let acceptedRequests = new Map<number, number>();
let nextFriendshipId = 2101;
let latencyMs = 280;

/** Restore this fictional account; state otherwise persists across reads and navigation. */
export function resetFriendsMockData(options: { latencyMs?: number } = {}) {
  latencyMs = options.latencyMs ?? 280;
  friends = friendSeeds.map(([displayName, email, profileImageUrl], index) => ({
    friendshipId: 2001 + index,
    user: {
      userId: 1001 + index,
      displayName,
      email: `${email}@example.com`,
      profileImageUrl,
      relationshipStatus: 'FRIEND',
      requestId: null,
    },
    acceptedAt: `2026-09-${String(24 - index).padStart(2, '0')}T18:30:00`,
  }));
  requests = requestSeeds.map(([displayName, email, profileImageUrl], index) => ({
    requestId: 3001 + index,
    user: {
      userId: 1101 + index,
      displayName,
      email: `${email}@example.com`,
      profileImageUrl,
      relationshipStatus: 'PENDING_RECEIVED',
      requestId: 3001 + index,
    },
    createdAt: `2026-10-0${2 - Math.floor(index / 2)}T${String(10 - index).padStart(2, '0')}:15:00`,
  }));
  acceptedRequests = new Map();
  nextFriendshipId = 2101;
}
resetFriendsMockData();

const jsonResponse = (value: unknown, status = 200) =>
  new Response(JSON.stringify(value), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });

const errorResponse = (status: 404 | 409) =>
  jsonResponse(
    {
      code: status === 404 ? 'NOT_FOUND' : 'CONFLICT',
      message: status === 404 ? 'Not Found' : 'Conflict',
      status,
    },
    status
  );
const respondAfterLatency = () => new Promise<void>((resolve) => setTimeout(resolve, latencyMs));

// Explicit development origin: never intercept another backend or production origin.
export const friendsHandlers = [
  http.get(`${FRIENDS_MOCK_ORIGIN}/friends`, async () => {
    await respondAfterLatency();
    return jsonResponse(friends);
  }),
  http.get(`${FRIENDS_MOCK_ORIGIN}/friends/requests/received`, async () => {
    await respondAfterLatency();
    return jsonResponse(requests);
  }),
  http.post(`${FRIENDS_MOCK_ORIGIN}/friends/requests/:requestId/accept`, async ({ params }) => {
    await respondAfterLatency();
    const requestId = Number(params.requestId);
    if (acceptedRequests.has(requestId)) return errorResponse(409);
    const request = requests.find((item) => item.requestId === requestId);
    if (!request) return errorResponse(404);
    const friend: MockFriend = {
      friendshipId: nextFriendshipId++,
      user: { ...request.user, relationshipStatus: 'FRIEND', requestId: null },
      acceptedAt: new Date().toISOString(),
    };
    requests = requests.filter((item) => item.requestId !== requestId);
    acceptedRequests.set(requestId, friend.friendshipId);
    friends = [friend, ...friends];
    return jsonResponse(friend);
  }),
  http.delete(`${FRIENDS_MOCK_ORIGIN}/friends/requests/:requestId`, async ({ params }) => {
    await respondAfterLatency();
    const requestId = Number(params.requestId);
    if (acceptedRequests.has(requestId)) return errorResponse(409);
    if (!requests.some((item) => item.requestId === requestId)) return errorResponse(404);
    requests = requests.filter((item) => item.requestId !== requestId);
    return new Response(null, { status: 204 });
  }),
  http.delete(`${FRIENDS_MOCK_ORIGIN}/friends/:friendshipId`, async ({ params }) => {
    await respondAfterLatency();
    const friendshipId = Number(params.friendshipId);
    if (!friends.some((item) => item.friendshipId === friendshipId)) return errorResponse(404);
    friends = friends.filter((item) => item.friendshipId !== friendshipId);
    for (const [requestId, acceptedFriendshipId] of acceptedRequests) {
      if (acceptedFriendshipId === friendshipId) acceptedRequests.delete(requestId);
    }
    return new Response(null, { status: 204 });
  }),
];
