/**
 * 토큰 사용 규칙: 컴포넌트에서는 semantic 토큰 우선, primitive는 semantic 정의 시에만 참조.
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
 *   title: { ...typography.primary.h1 },
 * });
 */

// Primitive tokens
export { primitiveColors } from './primitive/colors';
export { fontFamily } from './primitive/fonts';
export { typography } from './primitive/typography';
export { spacing } from './primitive/spacing';
export { radius } from './primitive/radius';

// Semantic tokens
export { semanticColors } from './semantic/colors';

// Icons
export { iconNames } from './icons';
export type { IconName } from './icons';
