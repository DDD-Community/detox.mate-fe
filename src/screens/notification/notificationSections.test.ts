import { describe, expect, it } from 'vitest';

import { formatNotificationTime, groupNotifications } from './notificationSections';

const iso = (year: number, month: number, day: number, hour = 0, minute = 0, second = 0) =>
  new Date(year, month - 1, day, hour, minute, second).toISOString();

describe('알림 날짜 표시', () => {
  it('자정을 넘기면 한 시간 이내의 알림도 어제로 묶고 시각으로 표시한다', () => {
    const now = new Date(2026, 9, 13, 0, 10);
    const createdAt = iso(2026, 10, 12, 23, 50);
    expect(groupNotifications([{ id: 1, createdAt }], now)[0].title).toBe('어제');
    expect(formatNotificationTime(createdAt, now)).toBe('오후 11:50');
  });

  it('기간 섹션을 합쳐도 서버의 최신순을 유지하고 빈 섹션은 숨긴다', () => {
    const now = new Date(2026, 9, 13, 12);
    const sections = groupNotifications(
      [
        { id: 1, createdAt: iso(2026, 10, 13, 11) },
        { id: 2, createdAt: iso(2026, 10, 11, 12) },
        { id: 3, createdAt: iso(2026, 10, 8, 12) },
      ],
      now
    );
    expect(sections.map(({ title, data }) => [title, data.map(({ id }) => id)])).toEqual([
      ['오늘', [1]],
      ['최근 7일', [2, 3]],
    ]);
    expect(formatNotificationTime(iso(2026, 10, 11, 12), now)).toBe('2일 전');
  });

  it('일광절약시간으로 하루 길이가 바뀌어도 날짜 기준으로 어제를 구분한다', () => {
    const now = new Date(2026, 2, 9, 0, 5);
    const createdAt = iso(2026, 3, 8, 0, 10);
    expect(groupNotifications([{ id: 1, createdAt }], now)[0].title).toBe('어제');
    expect(formatNotificationTime(createdAt, now)).toBe('오전 12:10');
  });

  it('오늘의 분·시간 경계와 어제의 정오·자정을 정확하게 표시한다', () => {
    const now = new Date(2026, 9, 13, 13);
    expect(formatNotificationTime(iso(2026, 10, 13, 12, 59, 1), now)).toBe('방금 전');
    expect(formatNotificationTime(iso(2026, 10, 13, 12, 59), now)).toBe('1분 전');
    expect(formatNotificationTime(iso(2026, 10, 13, 12), now)).toBe('1시간 전');
    expect(formatNotificationTime(iso(2026, 10, 12, 12), now)).toBe('오후 12:00');
    expect(formatNotificationTime(iso(2026, 10, 12, 0), now)).toBe('오전 12:00');
  });
});
