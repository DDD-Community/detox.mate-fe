import { describe, expect, it } from 'vitest';

import type { OCRResult } from '../ocrTypes';
import { analyzeScreenTimeImage } from '../analyzeScreenTimeImage';

function makeOCRResult(observations: OCRResult['observations']): OCRResult {
  return {
    imageWidth: 1179,
    imageHeight: 2556,
    elapsedMs: 218,
    observations,
  };
}

describe('analyzeScreenTimeImage', () => {
  it('returns hh:mm for a valid yesterday screen time image', async () => {
    const result = await analyzeScreenTimeImage('/tmp/legacy-ko.png', {
      now: new Date('2026-04-23T12:00:00+09:00'),
      timeZone: 'Asia/Seoul',
      recognizeText: async () =>
        makeOCRResult([
          {
            text: '스크린 타임',
            confidence: 0.99,
            boundingBox: { x: 0.08, y: 0.72, width: 0.18, height: 0.04 },
          },
          {
            text: '어제, 4월 22일',
            confidence: 0.99,
            boundingBox: { x: 0.09, y: 0.64, width: 0.22, height: 0.04 },
          },
          {
            text: '4시간 2분',
            confidence: 0.99,
            boundingBox: { x: 0.09, y: 0.56, width: 0.28, height: 0.08 },
          },
        ]),
    });

    expect(result).toEqual({
      ok: true,
      value: '04:02',
      dateLabel: '어제, 4월 22일',
      rawUsageText: '4시간 2분',
      elapsedMs: 218,
    });
  });

  it('returns a parse failure when the image is not yesterday', async () => {
    const result = await analyzeScreenTimeImage('/tmp/not-yesterday.png', {
      now: new Date('2026-04-23T12:00:00+09:00'),
      timeZone: 'Asia/Seoul',
      recognizeText: async () =>
        makeOCRResult([
          {
            text: 'Screen Time',
            confidence: 0.99,
            boundingBox: { x: 0.08, y: 0.72, width: 0.18, height: 0.04 },
          },
          {
            text: 'Today, April 23',
            confidence: 0.99,
            boundingBox: { x: 0.09, y: 0.64, width: 0.22, height: 0.04 },
          },
          {
            text: '4h 2m',
            confidence: 0.99,
            boundingBox: { x: 0.09, y: 0.56, width: 0.22, height: 0.08 },
          },
        ]),
    });

    expect(result).toEqual({
      ok: false,
      reason: 'date_not_yesterday',
      dateLabel: 'Today, April 23',
      elapsedMs: 218,
    });
  });

  it('rejects when the yesterday label does not match the actual yesterday date', async () => {
    const result = await analyzeScreenTimeImage('/tmp/mismatch.png', {
      now: new Date('2026-04-23T12:00:00+09:00'),
      timeZone: 'Asia/Seoul',
      recognizeText: async () =>
        makeOCRResult([
          {
            text: '스크린 타임',
            confidence: 0.99,
            boundingBox: { x: 0.08, y: 0.72, width: 0.18, height: 0.04 },
          },
          {
            text: '어제, 4월 21일',
            confidence: 0.99,
            boundingBox: { x: 0.09, y: 0.64, width: 0.22, height: 0.04 },
          },
          {
            text: '4시간 2분',
            confidence: 0.99,
            boundingBox: { x: 0.09, y: 0.56, width: 0.28, height: 0.08 },
          },
        ]),
    });

    expect(result).toEqual({
      ok: false,
      reason: 'summary_date_not_actual_yesterday',
      dateLabel: '어제, 4월 21일',
      elapsedMs: 218,
    });
  });

  it('allows the previous year at the new year boundary', async () => {
    const result = await analyzeScreenTimeImage('/tmp/new-year.png', {
      now: new Date('2026-01-01T10:00:00+09:00'),
      timeZone: 'Asia/Seoul',
      recognizeText: async () =>
        makeOCRResult([
          {
            text: 'Screen Time',
            confidence: 0.99,
            boundingBox: { x: 0.08, y: 0.72, width: 0.18, height: 0.04 },
          },
          {
            text: 'Yesterday, December 31',
            confidence: 0.99,
            boundingBox: { x: 0.09, y: 0.64, width: 0.25, height: 0.04 },
          },
          {
            text: '4h 2m',
            confidence: 0.99,
            boundingBox: { x: 0.09, y: 0.56, width: 0.22, height: 0.08 },
          },
        ]),
    });

    expect(result).toEqual({
      ok: true,
      value: '04:02',
      dateLabel: 'Yesterday, December 31',
      rawUsageText: '4h 2m',
      elapsedMs: 218,
    });
  });
});
