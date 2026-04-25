/**
 * 피그마 Color Palette의 raw 값. 컴포넌트에서 직접 사용하지 말고 semantic 토큰을 통해 사용하세요.
 */

const green = {
  50: '#eff3f1',
  75: '#bbcfc6',
  100: '#9fbbae',
  200: '#769d8c',
  300: '#5a8974',
  400: '#3f6051',
  500: '#375447',
} as const;

const brown = {
  50: '#f9f8f4',
  100: '#f1eacf',
  500: '#ba7517',
  600: '#7a5712',
  900: '#56524a',
} as const;

/** 디톡스 레벨 표현용 */
const level = {
  100: '#c1ff1c',
  200: '#6EE429',
  300: '#28CD25',
  400: '#21B653',
  500: '#1d9e75',
  600: '#007542',
} as const;

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

/** opacity100=불투명, opacity40=40%, opacity10=10% */
const system = {
  blue: {
    opacity100: '#508EBF',
    opacity40: '#508EBF66',
    opacity10: '#508EBF1A',
  },
  green: {
    opacity100: '#3A8F46',
    opacity40: '#3A8F4666',
    opacity10: '#3A8F461A',
  },
  orange: {
    opacity100: '#E39433',
    opacity40: '#E3943366',
    opacity10: '#E394331A',
  },
  red: {
    opacity100: '#D5441B',
    opacity40: '#D5441B66',
    opacity10: '#D5441B1A',
  },
} as const;

export const primitiveColors = {
  green,
  brown,
  level,
  gray,
  system,
} as const;
