import { http } from 'msw/core/http';

import type {
  FriendListUserResponse,
  FriendReceivedRequestResponse,
  FriendResponse,
  FriendInviteeResponse,
} from '../api/query-generated/model';

export const FRIENDS_MOCK_ORIGIN = 'https://api-dev.detoxmate.co.kr';

// Offline avatars keep the simulator independent of external image hosts.
const avatar = (background: string, foreground: string) =>
  `data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="120" height="120" viewBox="0 0 120 120"><rect width="120" height="120" rx="60" fill="${background}"/><circle cx="60" cy="44" r="22" fill="${foreground}"/><ellipse cx="60" cy="104" rx="40" ry="34" fill="${foreground}"/></svg>`)}`;

const friendSeeds = [
  ['김서연', 'F4JH8', avatar('#E7DCD0', '#A77B62')],
  ['이준호', 'J7HN2', null],
  ['박민지', 'M9PJ3', avatar('#D8E8E3', '#5B8C7B')],
  ['최도윤', 'D6YC4', null],
  ['정수빈', 'S5BJ7', null],
  ['한지우', 'H8JW6', avatar('#DDE3EF', '#7A89A8')],
  ['윤하린', 'Y3HR9', null],
  ['강현우', 'K2HW5', null],
] as const;
const requestSeeds = [
  ['오유진', 'R6YN2', avatar('#F0E2E5', '#B58391')],
  ['임수아', 'L7SA3', null],
  ['백지훈', 'B8JH4', null],
] as const;

let friends: FriendResponse[] = [];
let requests: FriendReceivedRequestResponse[] = [];
let acceptedRequests = new Map<number, number>();
let nextFriendshipId = 2101;
let latencyMs = 280;
let users: FriendListUserResponse[] = [];
let sentRequests = new Map<number, number>();
let nextRequestId = 4002;
const mutualConnections = new Map<number, number[]>([
  [1201, [1001, 1002, 1003]],
  [1202, []],
  [1203, [1001]],
  [1204, [1001, 1002]],
]);

let inviteReadFailures = 1;

export const FRIEND_INVITE_MOCK_CODES = {
  NONE: 'a2b3c'.repeat(12) + 'a2b3',
  PENDING_SENT: 'b9c5d'.repeat(12) + 'b9c5',
  PENDING_RECEIVED: 'c6d2e'.repeat(12) + 'c6d2',
  FRIEND: 'f4a8b'.repeat(12) + 'f4a8',
  SELF: 'd8e4f'.repeat(12) + 'd8e4',
  RETRY: 'e5a9b'.repeat(12) + 'e5a9',
} as const;

const inviteUsers: Record<string, FriendInviteeResponse> = {
  [FRIEND_INVITE_MOCK_CODES.NONE]: {
    userId: 1201,
    displayName: '홍길동',
    relationshipStatus: 'NONE',
  },
  [FRIEND_INVITE_MOCK_CODES.PENDING_SENT]: {
    userId: 1204,
    displayName: '정예린',
    relationshipStatus: 'PENDING_SENT',
    requestId: 4001,
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
    displayName: '이서진',
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
  friends = friendSeeds.map(([displayName, userCode, profileImageUrl], index) => ({
    friendshipId: 2001 + index,
    user: {
      userId: 1001 + index,
      displayName,
      userCode,
      profileImageUrl,
      relationshipStatus: 'FRIEND',
      requestId: null,
    },
    acceptedAt: `2026-09-${String(24 - index).padStart(2, '0')}T18:30:00`,
  }));
  requests = requestSeeds.map(([displayName, userCode, profileImageUrl], index) => ({
    requestId: 3001 + index,
    user: {
      userId: 1101 + index,
      displayName,
      userCode,
      profileImageUrl,
      relationshipStatus: 'PENDING_RECEIVED',
      requestId: 3001 + index,
    },
    createdAt: `2026-10-0${2 - Math.floor(index / 2)}T${String(10 - index).padStart(2, '0')}:15:00`,
  }));
  acceptedRequests = new Map();
  nextFriendshipId = 2101;
  inviteReadFailures = 1;
  nextRequestId = 4002;
  sentRequests = new Map([[1204, 4001]]);
  users = [
    ...friends.map((friend) => friend.user),
    ...requests.map((request) => request.user),
    ...(
      [
        [9001, '희정', 'K8VT4', 'SELF'],
        [1201, '홍길동', 'A2B3C', 'NONE'],
        [1202, '김다은', 'N4DA7', 'NONE'],
        [1203, '이서진', 'X5QA9', 'NONE'],
        [1204, '정예린', 'S9MQ5', 'PENDING_SENT'],
        [1205, '송유나', 'C7YN8', 'NONE'],
      ] as const
    ).map(([userId, displayName, userCode, relationshipStatus]) => ({
      userId,
      displayName,
      userCode,
      profileImageUrl: null,
      relationshipStatus,
      requestId: null,
    })),
  ];
}
resetFriendsMockData();

const jsonResponse = (value: unknown, status = 200) =>
  new Response(JSON.stringify(value), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });

const errorResponse = (status: 400 | 404 | 409 | 500) =>
  jsonResponse(
    {
      code:
        status === 404
          ? 'NOT_FOUND'
          : status === 409
            ? 'CONFLICT'
            : status === 400
              ? 'INVALID_REQUEST'
              : 'INTERNAL_SERVER_ERROR',
      message:
        status === 404
          ? 'Not Found'
          : status === 400
            ? '본인에게 친구 요청을 보낼 수 없습니다.'
            : 'Conflict',
      status,
    },
    status
  );
const respondAfterLatency = () =>
  latencyMs === 0
    ? Promise.resolve()
    : new Promise<void>((resolve) => setTimeout(resolve, latencyMs));

// Explicit development origin: never intercept another backend or production origin.
export const friendsHandlers = [
  http.get(`${FRIENDS_MOCK_ORIGIN}/friends/invite`, async () => {
    await respondAfterLatency();
    return jsonResponse({ code: FRIEND_INVITE_MOCK_CODES.SELF, userCode: 'K8VT4' });
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

  http.get(`${FRIENDS_MOCK_ORIGIN}/friends/search`, async ({ request }) => {
    const input = new URL(request.url).searchParams.get('userCode');
    const userCode = input?.trim().toUpperCase();
    await respondAfterLatency();
    if (!userCode || !/^[ABCDEFGHJKLMNPQRSTUVWXYZ23456789]{5}$/.test(userCode))
      return jsonResponse(
        {
          code: input === null ? 'USER_CODE_REQUIRED' : 'INVALID_USER_CODE',
          message: '올바른 사용자 코드를 입력해주세요.',
          status: 400,
        },
        400
      );
    if (userCode === 'ERRRR') return errorResponse(500);
    const user = users.find((candidate) => candidate.userCode === userCode);
    if (!user) return errorResponse(404);
    const friend = friends.find((item) => item.user.userId === user.userId);
    const received = requests.find((item) => item.user.userId === user.userId);
    const sent = sentRequests.get(user.userId!);
    const mutual = (mutualConnections.get(user.userId!) ?? [])
      .map((id) => friends.find((item) => item.user.userId === id))
      .filter((item) => item !== undefined);
    return jsonResponse({
      userId: user.userId,
      displayName: user.displayName,
      profileImageUrl: user.profileImageUrl,
      relationshipStatus:
        user.userId === 9001
          ? 'SELF'
          : friend
            ? 'FRIEND'
            : received
              ? 'PENDING_RECEIVED'
              : sent
                ? 'PENDING_SENT'
                : 'NONE',
      requestId: received?.requestId ?? sent ?? null,
      mutualFriendCount: mutual.length,
      mutualFriendPreviewName: mutual[0]?.user.displayName ?? null,
    });
  }),
  http.post(`${FRIENDS_MOCK_ORIGIN}/friends/requests`, async ({ request }) => {
    const { targetUserId } = (await request.json()) as { targetUserId: number };
    await respondAfterLatency();
    if (targetUserId === 9001) return errorResponse(400);
    const user = users.find((candidate) => candidate.userId === targetUserId);
    if (!user) return errorResponse(404);
    // A fictional concurrent relationship change exercises conflict reconciliation.
    if (targetUserId === 1205 && !sentRequests.has(targetUserId)) {
      sentRequests.set(targetUserId, nextRequestId++);
      return errorResponse(409);
    }
    if (
      friends.some((item) => item.user.userId === targetUserId) ||
      requests.some((item) => item.user.userId === targetUserId) ||
      sentRequests.has(targetUserId)
    )
      return errorResponse(409);
    const requestId = nextRequestId++;
    sentRequests.set(targetUserId, requestId);
    return jsonResponse(
      {
        requestId,
        user: {
          userId: user.userId,
          displayName: user.displayName,
          userCode: user.userCode,
          profileImageUrl: user.profileImageUrl,
          relationshipStatus: 'PENDING_SENT',
          requestId,
        },
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
    const friend: FriendResponse = {
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
