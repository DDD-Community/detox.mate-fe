import { http } from 'msw/core/http';

import type {
  NotificationHistoryListResponse,
  NotificationNavigationResponse,
} from '../api/notification-query/model';
import { FRIENDS_MOCK_ORIGIN } from './friendsHandlers';

const senders = ['홍길동', '김디톡', '박민준', '이서연', '최하늘'];
const messages = [
  '홍길동님이 친구 요청을 보냈어요.',
  '김디톡님과 친구가 되었어요! 함께 스크린타임을 줄여봐요.',
  '박민준님이 잠긴 앱을 10분 동안 일시 해제했어요.',
  '이서연님이 목표 제한 시간을 2시간으로 변경했어요.',
  '최하늘님이 잠긴 앱을 등록 해제했어요.',
];

export const notificationsHandlers = [
  http.get(`${FRIENDS_MOCK_ORIGIN}/notifications`, () => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const times = [
      now.getTime() - 10_000,
      Math.max(today, now.getTime() - 2 * 3_600_000),
      new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, 21, 12).getTime(),
      now.getTime() - 3 * 86_400_000,
      now.getTime() - 6 * 86_400_000,
    ];
    const response: NotificationHistoryListResponse = {
      notifications: messages.map((message, index) => ({
        id: index + 1,
        message,
        senderUserId: 501 + index,
        createdAt: new Date(times[index]).toISOString(),
      })),
    };
    return new Response(JSON.stringify(response), {
      headers: { 'Content-Type': 'application/json' },
    });
  }),
  http.get(`${FRIENDS_MOCK_ORIGIN}/notifications/:id/navigation`, ({ params }) => {
    const index = Number(params.id) - 1;
    const response: NotificationNavigationResponse = {
      navigable: true,
      url: `/friend-page?userId=${501 + index}&displayName=${encodeURIComponent(senders[index])}&relationshipStatus=NONE`,
    };
    return new Response(JSON.stringify(response), {
      headers: { 'Content-Type': 'application/json' },
    });
  }),
];
