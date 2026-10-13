import type { NotificationHistoryItemResponse } from '@/api/notification-query/model';

const DAY_MS = 24 * 60 * 60 * 1000;

export type NotificationSectionTitle = '오늘' | '어제' | '최근 7일';

export interface NotificationSection {
  title: NotificationSectionTitle;
  data: NotificationHistoryItemResponse[];
}

// Calendar dates, rather than elapsed 24-hour periods, keep yesterday correct across DST.
function calendarDay(date: Date) {
  return Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) / DAY_MS;
}

export function groupNotifications(
  notifications: NotificationHistoryItemResponse[],
  now = new Date()
): NotificationSection[] {
  const sections: NotificationSection[] = [
    { title: '오늘', data: [] },
    { title: '어제', data: [] },
    { title: '최근 7일', data: [] },
  ];

  for (const notification of notifications) {
    if (!notification.createdAt) continue;
    const created = new Date(notification.createdAt);
    if (Number.isNaN(created.getTime())) continue;
    const days = calendarDay(now) - calendarDay(created);
    sections[days <= 0 ? 0 : days === 1 ? 1 : 2].data.push(notification);
  }

  // The API returns newest first, so insertion preserves the order within each section.
  return sections.filter((section) => section.data.length > 0);
}

export function formatNotificationTime(createdAt: string, now = new Date()): string {
  const created = new Date(createdAt);
  const days = calendarDay(now) - calendarDay(created);
  if (days === 1) {
    const hour = created.getHours();
    const minute = String(created.getMinutes()).padStart(2, '0');
    return `${hour < 12 ? '오전' : '오후'} ${hour % 12 || 12}:${minute}`;
  }
  if (days > 1) return `${days}일 전`;

  const minutes = Math.floor((now.getTime() - created.getTime()) / 60_000);
  if (minutes < 1) return '방금 전';
  if (minutes < 60) return `${minutes}분 전`;
  return `${Math.floor(minutes / 60)}시간 전`;
}
