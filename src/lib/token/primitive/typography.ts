import type { TextStyle } from 'react-native';
import { fontFamily } from './fonts';

/**
 * NanumSquareRound는 Medium 웨이트가 없어 디자이너 스펙과 다르게 매핑:
 *   400(Regular) → NanumSquareRoundR
 *   500(Medium)  → NanumSquareRoundB   (Bold를 Medium 슬롯에 사용)
 *   700(Bold)    → NanumSquareRoundEB  (ExtraBold를 Bold 슬롯에 사용)
 */

const PRIMARY_FAMILY = {
  regular: fontFamily.primary.regular,
  medium: fontFamily.primary.medium,
  bold: fontFamily.primary.bold,
} as const;

const ACCENT_FAMILY = fontFamily.accent.regular;

export const fontSize = {
  9: 9,
  11: 11,
  12: 12,
  13: 13,
  14: 14,
  16: 16,
  18: 18,
  20: 20,
  22: 22,
  24: 24,
  26: 26,
  28: 28,
  30: 30,
  32: 32,
  34: 34,
} as const;

export const fontWeight = {
  regular: '400' as const,
  medium: '500' as const,
  bold: '700' as const,
};

const lhPrimary = (size: number) => size * 1.5;
const lhAccent = (size: number) => size * 1.3;

const primaryStyle = (
  size: number,
  family: (typeof PRIMARY_FAMILY)[keyof typeof PRIMARY_FAMILY],
  weight: '400' | '500' | '700'
): TextStyle => ({
  fontFamily: family,
  fontSize: size,
  fontWeight: weight,
  lineHeight: lhPrimary(size),
});

const accentStyle = (size: number): TextStyle => ({
  fontFamily: ACCENT_FAMILY,
  fontSize: size,
  fontWeight: '400',
  lineHeight: lhAccent(size),
});

const primary = {
  /** 32/Bold */
  h1: primaryStyle(32, PRIMARY_FAMILY.bold, '700'),
  /** 28/Bold */
  h2: primaryStyle(28, PRIMARY_FAMILY.bold, '700'),
  /** 24/Bold */
  h3: primaryStyle(24, PRIMARY_FAMILY.bold, '700'),

  /** 20/Bold */
  title1B: primaryStyle(20, PRIMARY_FAMILY.bold, '700'),
  /** 20/Medium */
  title1M: primaryStyle(20, PRIMARY_FAMILY.medium, '500'),
  /** 18/Bold */
  title2B: primaryStyle(18, PRIMARY_FAMILY.bold, '700'),
  /** 18/Medium */
  title2M: primaryStyle(18, PRIMARY_FAMILY.medium, '500'),

  /** 16/Bold */
  body1B: primaryStyle(16, PRIMARY_FAMILY.bold, '700'),
  /** 16/Medium */
  body1M: primaryStyle(16, PRIMARY_FAMILY.medium, '500'),
  /** 16/Regular */
  body1R: primaryStyle(16, PRIMARY_FAMILY.regular, '400'),

  /** 14/Bold */
  body2B: primaryStyle(14, PRIMARY_FAMILY.bold, '700'),
  /** 14/Medium */
  body2M: primaryStyle(14, PRIMARY_FAMILY.medium, '500'),
  /** 14/Regular */
  body2R: primaryStyle(14, PRIMARY_FAMILY.regular, '400'),

  /** 12/Bold */
  body3B: primaryStyle(12, PRIMARY_FAMILY.bold, '700'),
  /** 12/Medium */
  body3M: primaryStyle(12, PRIMARY_FAMILY.medium, '500'),
  /** 12/Regular */
  body3R: primaryStyle(12, PRIMARY_FAMILY.regular, '400'),

  /** 11/Regular */
  caption: primaryStyle(11, PRIMARY_FAMILY.regular, '400'),
  /** 9/Regular */
  caption2: primaryStyle(9, PRIMARY_FAMILY.regular, '400'),
} as const;

const accent = {
  /** 34/Regular */
  h1: accentStyle(34),
  /** 30/Regular */
  h2: accentStyle(30),
  /** 26/Regular */
  h3: accentStyle(26),

  /** 22/Regular */
  title1: accentStyle(22),
  /** 20/Regular */
  title2: accentStyle(20),

  /** 18/Regular */
  body1: accentStyle(18),
  /** 16/Regular */
  body2: accentStyle(16),
  /** 14/Regular */
  body3: accentStyle(14),

  /** 13/Regular */
  caption: accentStyle(13),
} as const;

export const typography = {
  primary,
  accent,
} as const;
