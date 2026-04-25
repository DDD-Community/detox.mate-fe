import type { ExpectedResult } from './types';

export const OCR_EXPECTED_RESULTS: ExpectedResult[] = [
  {
    fixtureId: 'legacy_ko',
    expectedStatus: 'ok',
    expectedDateLabel: '어제, 4월 22일',
    expectedUsageText: '4시간 2분',
  },
  {
    fixtureId: 'legacy_en',
    expectedStatus: 'ok',
    expectedDateLabel: 'Yesterday, April 22',
    expectedUsageText: '4h 2m',
  },
  {
    fixtureId: 'ios26_ko',
    expectedStatus: 'ok',
    expectedDateLabel: '어제, 4월 22일',
    expectedUsageText: '15시간 2분',
  },
  {
    fixtureId: 'ios26_en_2',
    expectedStatus: 'ok',
    expectedDateLabel: 'Yesterday, April 22',
    expectedUsageText: '8h 57m',
  },
  {
    fixtureId: 'legacy_en_today',
    expectedStatus: 'reject',
    expectedReason: 'date_not_yesterday',
  },
  {
    fixtureId: 'ios26_ko_today',
    expectedStatus: 'reject',
    expectedReason: 'summary_date_missing',
  },
];
