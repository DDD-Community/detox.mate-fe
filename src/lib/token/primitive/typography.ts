import type { TextStyle } from 'react-native';

/**
 * Typography Tokens
 *
 * 두 종류의 폰트 세트를 제공합니다.
 *
 * 1) primary — NanumSquareRound (메인 UI 타이포그래피)
 *    - line-height: 150%
 *    - 디자이너 weight 매핑:
 *      400(Regular)  → NanumSquareRoundR
 *      500(Medium)   → NanumSquareRoundB   (Bold가 시각적으로 Medium 역할)
 *      700(Bold)     → NanumSquareRoundEB  (ExtraBold가 시각적으로 Bold 역할)
 *
 * 2) accent — Omyu pretty (보조/데코 타이포그래피, Regular 단일)
 *    - line-height: 130%
 *    - letter-spacing: 0
 *    - TTF 미준비 상태이므로 사용 시점에 폰트 fallback 발생 가능
 *
 * @example
 * import { typography } from 'src/lib/token';
 *
 * const styles = StyleSheet.create({
 *   title: { ...typography.primary.h1 },
 *   body:  { ...typography.primary.body1R },
 *   deco:  { ...typography.accent.h1 },
 * });
 */

const PRIMARY_FAMILY = {
  regular: 'NanumSquareRoundR',
  medium: 'NanumSquareRoundB',
  bold: 'NanumSquareRoundEB',
} as const;

const ACCENT_FAMILY = 'OmyuPretty';

/** Font size scale (primary + accent 통합) */
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

/** Font weight 매핑 — 디자인 스펙 weight 기준 */
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
  weight: '400' | '500' | '700',
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
  /** Headline 1 — 32/Bold */
  h1: primaryStyle(32, PRIMARY_FAMILY.bold, '700'),
  /** Headline 2 — 28/Bold */
  h2: primaryStyle(28, PRIMARY_FAMILY.bold, '700'),
  /** Headline 3 — 24/Bold */
  h3: primaryStyle(24, PRIMARY_FAMILY.bold, '700'),

  /** Title 1 Bold — 20/Bold */
  title1B: primaryStyle(20, PRIMARY_FAMILY.bold, '700'),
  /** Title 1 Medium — 20/Medium */
  title1M: primaryStyle(20, PRIMARY_FAMILY.medium, '500'),
  /** Title 2 Bold — 18/Bold */
  title2B: primaryStyle(18, PRIMARY_FAMILY.bold, '700'),
  /** Title 2 Medium — 18/Medium */
  title2M: primaryStyle(18, PRIMARY_FAMILY.medium, '500'),

  /** Body 1 Bold — 16/Bold */
  body1B: primaryStyle(16, PRIMARY_FAMILY.bold, '700'),
  /** Body 1 Medium — 16/Medium */
  body1M: primaryStyle(16, PRIMARY_FAMILY.medium, '500'),
  /** Body 1 Regular — 16/Regular */
  body1R: primaryStyle(16, PRIMARY_FAMILY.regular, '400'),

  /** Body 2 Bold — 14/Bold */
  body2B: primaryStyle(14, PRIMARY_FAMILY.bold, '700'),
  /** Body 2 Medium — 14/Medium */
  body2M: primaryStyle(14, PRIMARY_FAMILY.medium, '500'),
  /** Body 2 Regular — 14/Regular */
  body2R: primaryStyle(14, PRIMARY_FAMILY.regular, '400'),

  /** Body 3 Bold — 12/Bold */
  body3B: primaryStyle(12, PRIMARY_FAMILY.bold, '700'),
  /** Body 3 Medium — 12/Medium */
  body3M: primaryStyle(12, PRIMARY_FAMILY.medium, '500'),
  /** Body 3 Regular — 12/Regular */
  body3R: primaryStyle(12, PRIMARY_FAMILY.regular, '400'),

  /** Caption — 11/Regular */
  caption: primaryStyle(11, PRIMARY_FAMILY.regular, '400'),
  /** Caption2 — 9/Regular */
  caption2: primaryStyle(9, PRIMARY_FAMILY.regular, '400'),
} as const;

const accent = {
  /** Headline 1 — 34/Regular (Omyu) */
  h1: accentStyle(34),
  /** Headline 2 — 30/Regular (Omyu) */
  h2: accentStyle(30),
  /** Headline 3 — 26/Regular (Omyu) */
  h3: accentStyle(26),

  /** Title 1 — 22/Regular (Omyu) */
  title1: accentStyle(22),
  /** Title 2 — 20/Regular (Omyu) */
  title2: accentStyle(20),

  /** Body 1 — 18/Regular (Omyu) */
  body1: accentStyle(18),
  /** Body 2 — 16/Regular (Omyu) */
  body2: accentStyle(16),
  /** Body 3 — 14/Regular (Omyu) */
  body3: accentStyle(14),

  /** Caption — 13/Regular (Omyu) */
  caption: accentStyle(13),
} as const;

export const typography = {
  primary,
  accent,
} as const;
