/**
 * Design Token System
 *
 * 토큰 사용 규칙:
 * - 컴포넌트에서는 semantic 토큰 우선 사용
 * - primitive는 semantic 정의 시에만 참조
 * - 모든 토큰은 `as const`로 정의되어 TypeScript 리터럴 타입 자동완성 지원
 *
 * @example
 * import { semanticColors, typography, spacing, radius } from 'src/lib/token';
 *
 * const styles = StyleSheet.create({
 *   container: {
 *     backgroundColor: semanticColors.bg.primary,
 *     padding: spacing[16],
 *     borderRadius: radius[12],
 *   },
 *   title: {
 *     ...typography.h1,
 *   },
 * });
 */

// Primitive tokens
export { primitiveColors } from './primitive/colors';
export { typography } from './primitive/typography';
export { spacing } from './primitive/spacing';
export { radius } from './primitive/radius';

// Semantic tokens
export { semanticColors } from './semantic/colors';

// Icons
export { iconNames } from './icons';
export type { IconName } from './icons';
