/**
 * 토큰 사용 규칙: 컴포넌트에서는 primitive 토큰을 직접 참조한다.
 *
 * @example
 * import { primitiveColors, typography, spacing, radius } from 'src/lib/token';
 *
 * const { gray } = primitiveColors;
 *
 * const styles = StyleSheet.create({
 *   container: {
 *     backgroundColor: '#FFFFFF',
 *     padding: spacing[16],
 *     borderRadius: radius[12],
 *   },
 *   title: { ...typography.h1, color: gray[900] },
 * });
 */

// Primitive tokens
export { primitiveColors } from './primitive/colors';
export { fontFamily } from './primitive/fonts';
export { typography } from './primitive/typography';
export { spacing } from './primitive/spacing';
export { radius } from './primitive/radius';

// Icons
export { iconNames } from './icons';
export type { IconName } from './icons';
