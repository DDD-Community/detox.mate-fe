import type { TextStyle } from 'react-native';

/**
 * Typography Tokens
 *
 * Font: Pretendard
 * Letter-spacing: -2% (global)
 * Line-height: 150% (global)
 *
 * 스타일 네이밍 규칙: {hierarchy}{size}{Weight}
 * - Weight: B(bold), M(medium), R(regular)
 *
 * @example
 * import { typography } from 'src/lib/token';
 *
 * const styles = StyleSheet.create({
 *   title: { ...typography.h1 },
 *   body: { ...typography.body1R },
 * });
 */

const FONT_FAMILY = 'Pretendard';

/** Font size scale */
export const fontSize = {
  11: 11,
  12: 12,
  14: 14,
  16: 16,
  18: 18,
  20: 20,
  24: 24,
  28: 28,
  32: 32,
} as const;

/** Font weight mapping */
export const fontWeight = {
  regular: '400' as const,
  medium: '500' as const,
  bold: '700' as const,
};

/** letter-spacing 계산: fontSize * -0.02 */
const ls = (size: number) => size * -0.02;

/** line-height 계산: fontSize * 1.5 */
const lh = (size: number) => size * 1.5;

/** 스타일 프리셋 생성 헬퍼 */
const style = (size: number, weight: '400' | '500' | '700'): TextStyle => ({
  fontFamily: FONT_FAMILY,
  fontSize: size,
  fontWeight: weight,
  lineHeight: lh(size),
  letterSpacing: ls(size),
});

// --- Headline ---

const h1 = style(32, '700');
const h2 = style(28, '700');
const h3 = style(24, '700');

// --- Title ---

const title1B = style(20, '700');
const title1M = style(20, '500');
const title2B = style(18, '700');
const title2M = style(18, '500');

// --- Body ---

const body1B = style(16, '700');
const body1M = style(16, '500');
const body1R = style(16, '400');

const body2B = style(14, '700');
const body2M = style(14, '500');
const body2R = style(14, '400');

const body3B = style(12, '700');
const body3M = style(12, '500');
const body3R = style(12, '400');

// --- Caption ---

const caption2 = style(11, '400');

export const typography = {
  /** Headline 1 — 32/bold */
  h1,
  /** Headline 2 — 28/bold */
  h2,
  /** Headline 3 — 24/bold */
  h3,
  /** Title 1 Bold — 20/bold */
  title1B,
  /** Title 1 Medium — 20/medium */
  title1M,
  /** Title 2 Bold — 18/bold */
  title2B,
  /** Title 2 Medium — 18/medium */
  title2M,
  /** Body 1 Bold — 16/bold */
  body1B,
  /** Body 1 Medium — 16/medium */
  body1M,
  /** Body 1 Regular — 16/regular */
  body1R,
  /** Body 2 Bold — 14/bold */
  body2B,
  /** Body 2 Medium — 14/medium */
  body2M,
  /** Body 2 Regular — 14/regular */
  body2R,
  /** Body 3 Bold — 12/bold */
  body3B,
  /** Body 3 Medium — 12/medium */
  body3M,
  /** Body 3 Regular — 12/regular */
  body3R,
  /** Caption 2 — 11/regular */
  caption2,
} as const;
