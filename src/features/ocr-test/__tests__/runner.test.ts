import { describe, expect, it } from 'vitest';

import { compareAgainstExpected, runFixtureOnce } from '../runner';
import type { ExpectedResult, OCRResult, ParsedResult } from '../types';

describe('compareAgainstExpected', () => {
  it('passes successful exact matches', () => {
    const expected: ExpectedResult = {
      fixtureId: 'legacy_ko',
      expectedStatus: 'ok',
      expectedDateLabel: '어제, 4월 22일',
      expectedUsageText: '4시간 2분',
    };

    const actual: ParsedResult = {
      ok: true,
      dateLabel: '어제, 4월 22일',
      usageText: '4시간 2분',
    };

    expect(compareAgainstExpected(actual, expected)).toEqual({
      pass: true,
      mismatchReason: null,
    });
  });

  it('fails when reject reasons do not match', () => {
    const expected: ExpectedResult = {
      fixtureId: 'ios26_ko_today',
      expectedStatus: 'reject',
      expectedReason: 'summary_date_missing',
    };

    const actual: ParsedResult = {
      ok: false,
      reason: 'date_not_yesterday',
      dateLabel: '오늘, 4월 23일',
    };

    expect(compareAgainstExpected(actual, expected)).toEqual({
      pass: false,
      mismatchReason: 'expected reject reason summary_date_missing but got date_not_yesterday',
    });
  });

  it('builds a full fixture run from OCR output and expected result', async () => {
    const ocrResult: OCRResult = {
      imageWidth: 1179,
      imageHeight: 2556,
      elapsedMs: 231,
      observations: [
        {
          text: 'Screen Time',
          confidence: 0.99,
          boundingBox: { x: 0.08, y: 0.72, width: 0.18, height: 0.04 },
        },
        {
          text: 'Yesterday, April 22',
          confidence: 0.99,
          boundingBox: { x: 0.09, y: 0.64, width: 0.25, height: 0.04 },
        },
        {
          text: '8h 57m',
          confidence: 0.99,
          boundingBox: { x: 0.09, y: 0.56, width: 0.22, height: 0.08 },
        },
      ],
    };

    const run = await runFixtureOnce({
      fixtureId: 'ios26_en_2',
      runIndex: 1,
      expected: {
        fixtureId: 'ios26_en_2',
        expectedStatus: 'ok',
        expectedDateLabel: 'Yesterday, April 22',
        expectedUsageText: '8h 57m',
      },
      recognizeText: async () => ocrResult,
      imageUri: 'file:///ios26_en_2.png',
    });

    expect(run).toEqual({
      fixtureId: 'ios26_en_2',
      runIndex: 1,
      imageUri: 'file:///ios26_en_2.png',
      ocrResult,
      parsedResult: {
        ok: true,
        dateLabel: 'Yesterday, April 22',
        usageText: '8h 57m',
      },
      pass: true,
      mismatchReason: null,
    });
  });
});
