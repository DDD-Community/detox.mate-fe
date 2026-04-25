/**
 * Primitive Color Tokens
 *
 * 피그마 Color Palette의 raw 값을 정의합니다.
 * 컴포넌트에서 직접 사용하지 말고, semantic 토큰을 통해 사용하세요.
 *
 * @example
 * // ❌ 직접 사용 금지
 * import { primitiveColors } from 'src/lib/token';
 *
 * // ✅ semantic 토큰 사용
 * import { semanticColors } from 'src/lib/token';
 */

/** Primary green scale (green-50 ~ green-500) */
const green = {
  50: '#eff3f1',
  75: '#bbcfc6',
  100: '#9fbbae',
  200: '#769d8c',
  300: '#5a8974',
  400: '#3f6051',
  500: '#375447',
} as const;

/** Secondary brown scale (brown-50 ~ brown-900) */
const brown = {
  50: '#f9f8f4',
  100: '#f1eacf',
  500: '#ba7517',
  600: '#7a5712',
  900: '#56524a',
} as const;

/** Level scale — 디톡스 레벨 표현용 (level-100 ~ level-600) */
const level = {
  100: '#c1ff1c',
  200: '#6EE429',
  300: '#28CD25',
  400: '#21B653',
  500: '#1d9e75',
  600: '#007542',
} as const;

/** Gray scale — cool-tone gray (gray-50 ~ gray-900) */
const gray = {
  50: '#f0f1f3',
  100: '#d0d3d9',
  200: '#b9bdc7',
  300: '#989fad',
  400: '#858d9d',
  500: '#667085',
  600: '#5d6679',
  700: '#48505e',
  800: '#383e49',
  900: '#2b2f38',
} as const;

/** System colors — base hex + opacity variants (100/40/10) */
const system = {
  blue: {
    100: '#508EBF',
    40: 'rgba(80, 142, 191, 0.4)',
    10: 'rgba(80, 142, 191, 0.1)',
  },
  green: {
    100: '#3A8F46',
    40: 'rgba(58, 143, 70, 0.4)',
    10: 'rgba(58, 143, 70, 0.1)',
  },
  orange: {
    100: '#E39433',
    40: 'rgba(227, 148, 51, 0.4)',
    10: 'rgba(227, 148, 51, 0.1)',
  },
  red: {
    100: '#D5441B',
    40: 'rgba(213, 68, 27, 0.4)',
    10: 'rgba(213, 68, 27, 0.1)',
  },
} as const;

export const primitiveColors = {
  green,
  brown,
  level,
  gray,
  system,
} as const;
