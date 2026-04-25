import { describe, expect, it } from 'vitest';

import {
  isSummaryDateLabelActualYesterday,
  parseSummaryDateLabelMonthDay,
} from '../summaryDate';

describe('parseSummaryDateLabelMonthDay', () => {
  it('parses Korean yesterday month/day labels', () => {
    expect(parseSummaryDateLabelMonthDay('어제, 4월 22일')).toEqual({
      month: 4,
      day: 22,
    });
  });

  it('parses English yesterday month/day labels', () => {
    expect(parseSummaryDateLabelMonthDay('Yesterday, April 22')).toEqual({
      month: 4,
      day: 22,
    });
  });

  it('returns null when there is no parseable calendar date', () => {
    expect(parseSummaryDateLabelMonthDay('Yesterday')).toBeNull();
  });
});

describe('isSummaryDateLabelActualYesterday', () => {
  it('returns true when the label matches the actual yesterday in the injected time zone', () => {
    expect(
      isSummaryDateLabelActualYesterday('어제, 4월 22일', {
        now: new Date('2026-04-23T12:00:00+09:00'),
        timeZone: 'Asia/Seoul',
      }),
    ).toBe(true);
  });

  it('returns false when the label month/day does not match the actual yesterday', () => {
    expect(
      isSummaryDateLabelActualYesterday('어제, 4월 21일', {
        now: new Date('2026-04-23T12:00:00+09:00'),
        timeZone: 'Asia/Seoul',
      }),
    ).toBe(false);
  });

  it('allows the previous year at the january boundary', () => {
    expect(
      isSummaryDateLabelActualYesterday('Yesterday, December 31', {
        now: new Date('2026-01-01T10:00:00+09:00'),
        timeZone: 'Asia/Seoul',
      }),
    ).toBe(true);
  });

  it('uses the injected time zone instead of the environment local time', () => {
    expect(
      isSummaryDateLabelActualYesterday('Yesterday, April 21', {
        now: new Date('2026-04-23T01:30:00Z'),
        timeZone: 'America/Los_Angeles',
      }),
    ).toBe(true);
  });
});
