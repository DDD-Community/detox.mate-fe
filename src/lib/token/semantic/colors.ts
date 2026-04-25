/**
 * Semantic Color Tokens
 *
 * primitive color를 기반으로 UI 의미(역할)에 따라 매핑한 색상 토큰입니다.
 * 컴포넌트에서는 항상 semantic 토큰을 사용하세요.
 *
 * 다크모드 확장 시 이 파일만 교체/분기하면 테마 전환이 가능합니다.
 * (예: semantic/colors.dark.ts를 추가하여 import level에서 swap)
 *
 * @example
 * import { semanticColors } from 'src/lib/token';
 *
 * const styles = StyleSheet.create({
 *   container: {
 *     backgroundColor: semanticColors.bg.primary,
 *     borderColor: semanticColors.border.primary,
 *   },
 *   title: {
 *     color: semanticColors.text.primary,
 *   },
 * });
 */
import { primitiveColors } from '../primitive/colors';

const { green, gray, system } = primitiveColors;

/** 텍스트 색상 */
const text = {
  primary: gray[900],
  secondary: gray[600],
  tertiary: gray[400],
  disabled: gray[300],
  inverse: '#FFFFFF',
  brand: green[500],
} as const;

/** 배경 색상 */
const bg = {
  primary: '#FFFFFF',
  secondary: gray[50],
  tertiary: gray[100],
  inverse: gray[900],
  brand: green[500],
  brandSubtle: green[50],
} as const;

/** 보더 색상 */
const border = {
  primary: gray[200],
  secondary: gray[100],
  strong: gray[400],
  brand: green[500],
  focus: green[400],
} as const;

/** 아이콘 색상 */
const icon = {
  primary: gray[800],
  secondary: gray[500],
  tertiary: gray[400],
  disabled: gray[300],
  inverse: '#FFFFFF',
  brand: green[500],
} as const;

/** 상태/피드백 색상 */
const status = {
  info: system.blue[100],
  infoSubtle: system.blue[10],
  success: system.green[100],
  successSubtle: system.green[10],
  warning: system.orange[100],
  warningSubtle: system.orange[10],
  error: system.red[100],
  errorSubtle: system.red[10],
} as const;

/** 인터랙션 색상 */
const interaction = {
  pressed: green[500],
  hovered: green[400],
  focused: green[300],
  disabled: gray[200],
} as const;

export const semanticColors = {
  text,
  bg,
  border,
  icon,
  status,
  interaction,
} as const;
