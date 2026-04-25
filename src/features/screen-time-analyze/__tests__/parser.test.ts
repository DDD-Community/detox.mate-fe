import { describe, expect, it } from 'vitest';

import type { OCRObservation } from '../ocrTypes';
import { parseScreenTimeSummary } from '../parser';

function observation(
  text: string,
  rect: { x: number; y: number; width: number; height: number },
  confidence = 0.99,
): OCRObservation {
  return {
    text,
    confidence,
    boundingBox: rect,
  };
}

describe('parseScreenTimeSummary', () => {
  it('extracts yesterday summary usage from Korean screen time observations', () => {
    const observations: OCRObservation[] = [
      observation('스크린 타임', { x: 0.08, y: 0.72, width: 0.18, height: 0.04 }),
      observation('어제, 4월 22일', { x: 0.09, y: 0.64, width: 0.22, height: 0.04 }),
      observation('15시간 2분', { x: 0.09, y: 0.56, width: 0.28, height: 0.08 }),
      observation('오늘 오후 11:24에 업데이트됨', {
        x: 0.09,
        y: 0.18,
        width: 0.3,
        height: 0.03,
      }),
      observation('네이버 웹툰', { x: 0.09, y: 0.08, width: 0.2, height: 0.04 }),
      observation('3시간 53분', { x: 0.68, y: 0.08, width: 0.16, height: 0.04 }),
    ];

    expect(parseScreenTimeSummary(observations)).toEqual({
      ok: true,
      dateLabel: '어제, 4월 22일',
      usageText: '15시간 2분',
    });
  });

  it('rejects when summary date is today in English', () => {
    const observations: OCRObservation[] = [
      observation('Screen Time', { x: 0.08, y: 0.72, width: 0.18, height: 0.04 }),
      observation('Today, April 23', { x: 0.09, y: 0.64, width: 0.22, height: 0.04 }),
      observation('4h 2m', { x: 0.09, y: 0.56, width: 0.22, height: 0.08 }),
    ];

    expect(parseScreenTimeSummary(observations)).toEqual({
      ok: false,
      dateLabel: 'Today, April 23',
      reason: 'date_not_yesterday',
    });
  });

  it('ignores updated-today status text when summary date is missing', () => {
    const observations: OCRObservation[] = [
      observation('스크린 타임', { x: 0.08, y: 0.72, width: 0.18, height: 0.04 }),
      observation('6시간 35분', { x: 0.09, y: 0.56, width: 0.28, height: 0.08 }),
      observation('오늘 오후 10:34에 업데이트됨', {
        x: 0.09,
        y: 0.18,
        width: 0.3,
        height: 0.03,
      }),
    ];

    expect(parseScreenTimeSummary(observations)).toEqual({
      ok: false,
      reason: 'summary_date_missing',
    });
  });
});
