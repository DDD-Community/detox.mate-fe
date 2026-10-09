import { http } from 'msw/core/http';

import type {
  FriendListUserResponse,
  FriendReceivedRequestResponse,
  FriendResponse,
  FriendInviteeResponse,
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
let sentRequests = new Map<number, number>();
let inviteReadFailures = 1;
let nextRequestId = 3101;

export const FRIEND_INVITE_MOCK_CODES = {
  NONE: 'n7Kp2Rt9Xc4V',
  PENDING_SENT: 's9Mq5Ba3Ld8H',
  PENDING_RECEIVED: 'r6Yn1Ce8Wk3P',
  FRIEND: 'f4Jh8Ds2Uv7N',
  SELF: 'k8Vt4Nz2Qp7R',
  RETRY: 'x5Qa9Lp2Tc7M',
} as const;

const inviteUsers: Record<string, FriendInviteeResponse> = {
  [FRIEND_INVITE_MOCK_CODES.NONE]: {
    userId: 1201,
    displayName: '홍길동',
    relationshipStatus: 'NONE',
  },
  [FRIEND_INVITE_MOCK_CODES.PENDING_SENT]: {
    userId: 1202,
    displayName: '이서진',
    relationshipStatus: 'PENDING_SENT',
    requestId: 3100,
  },
  [FRIEND_INVITE_MOCK_CODES.PENDING_RECEIVED]: {
    userId: 1101,
    displayName: '오유진',
    relationshipStatus: 'PENDING_RECEIVED',
    requestId: 3001,
  },
  [FRIEND_INVITE_MOCK_CODES.FRIEND]: {
    userId: 1001,
    displayName: '김서연',
    relationshipStatus: 'FRIEND',
  },
  [FRIEND_INVITE_MOCK_CODES.SELF]: {
    userId: 9001,
    displayName: '희정',
    relationshipStatus: 'SELF',
  },
  [FRIEND_INVITE_MOCK_CODES.RETRY]: {
    userId: 1203,
    displayName: '김민준',
    relationshipStatus: 'NONE',
  },
};

function currentInvitee(seed: FriendInviteeResponse): FriendInviteeResponse {
  if (seed.relationshipStatus === 'SELF') return seed;
  const friend = friends.find((item) => item.user.userId === seed.userId);
  const request = requests.find((item) => item.user.userId === seed.userId);
  const sent = sentRequests.get(seed.userId!);
  return {
    ...seed,
    profileImageUrl: friend?.user.profileImageUrl ?? request?.user.profileImageUrl ?? undefined,
    relationshipStatus: friend
      ? 'FRIEND'
      : request
        ? 'PENDING_RECEIVED'
        : sent
          ? 'PENDING_SENT'
          : 'NONE',
    requestId: request?.requestId ?? sent,
  };
}

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
  sentRequests = new Map([[1202, 3100]]);
  inviteReadFailures = 1;
  nextRequestId = 3101;
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
  http.get(`${FRIENDS_MOCK_ORIGIN}/friends/invite`, async () => {
    await respondAfterLatency();
    return jsonResponse({ code: FRIEND_INVITE_MOCK_CODES.SELF, email: 'heejeong@example.com' });
  }),
  http.get(`${FRIENDS_MOCK_ORIGIN}/friends/invite/:code`, async ({ params }) => {
    await respondAfterLatency();
    if (params.code === FRIEND_INVITE_MOCK_CODES.RETRY && inviteReadFailures > 0) {
      inviteReadFailures -= 1;
      return jsonResponse(
        { code: 'SERVICE_UNAVAILABLE', message: '잠시 후 다시 시도해 주세요.', status: 503 },
        503
      );
    }
    const seed = inviteUsers[String(params.code)];
    return seed ? jsonResponse(currentInvitee(seed)) : errorResponse(404);
  }),
  http.post(`${FRIENDS_MOCK_ORIGIN}/friends/requests`, async ({ request }) => {
    await respondAfterLatency();
    const body = (await request.json()) as { targetUserId?: number };
    const seed = Object.values(inviteUsers).find((user) => user.userId === body.targetUserId);
    if (!seed) return errorResponse(404);
    const user = currentInvitee(seed);
    if (user.relationshipStatus !== 'NONE') return errorResponse(409);
    const requestId = nextRequestId++;
    sentRequests.set(user.userId!, requestId);
    return jsonResponse(
      {
        requestId,
        user: { ...user, relationshipStatus: 'PENDING_SENT', requestId },
        createdAt: new Date().toISOString(),
      },
      201
    );
  }),
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
