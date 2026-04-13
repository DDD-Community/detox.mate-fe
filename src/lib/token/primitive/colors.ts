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

/** Primary green scale (green-50 ~ green-900) */
const green = {
  50: '#e8f5f1',
  100: '#b9e1d4',
  200: '#97d2c0',
  300: '#68bea3',
  400: '#4ab191',
  500: '#1d9e75',
  600: '#1a906a',
  700: '#157053',
  800: '#105740',
  900: '#0c4231',
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
    100: '#2D9BF2',
    40: 'rgba(45, 155, 242, 0.4)',
    10: 'rgba(45, 155, 242, 0.1)',
  },
  green: {
    100: '#48B156',
    40: 'rgba(72, 177, 86, 0.4)',
    10: 'rgba(72, 177, 86, 0.1)',
  },
  orange: {
    100: '#FF991D',
    40: 'rgba(255, 153, 29, 0.4)',
    10: 'rgba(255, 153, 29, 0.1)',
  },
  red: {
    100: '#F53F34',
    40: 'rgba(245, 63, 52, 0.4)',
    10: 'rgba(245, 63, 52, 0.1)',
  },
} as const;

export const primitiveColors = {
  green,
  level,
  gray,
  system,
} as const;
