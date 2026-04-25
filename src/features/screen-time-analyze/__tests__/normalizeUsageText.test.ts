import { describe, expect, it } from 'vitest';

import { normalizeUsageTextToHHMM } from '../normalizeUsageText';

describe('normalizeUsageTextToHHMM', () => {
  it('converts Korean hour-minute text into hh:mm', () => {
    expect(normalizeUsageTextToHHMM('4시간 2분')).toBe('04:02');
  });

  it('converts English hour-minute text into hh:mm', () => {
    expect(normalizeUsageTextToHHMM('8h 57m')).toBe('08:57');
  });

  it('converts minute-only text into hh:mm', () => {
    expect(normalizeUsageTextToHHMM('52분')).toBe('00:52');
  });
});
