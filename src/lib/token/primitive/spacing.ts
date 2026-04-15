/**
 * Spacing Tokens
 *
 * 간격은 margin, padding, gap 등에 사용되며, 짝수만 사용합니다.
 * 8배수 또는 4배수를 권장하며, 홀수가 나올 경우 전체 크기를 짝수로 맞춰줍니다.
 *
 * @example
 * import { spacing } from 'src/lib/token';
 *
 * const styles = StyleSheet.create({
 *   container: {
 *     padding: spacing[16],
 *     gap: spacing[8],
 *     marginBottom: spacing[24],
 *   },
 * });
 */
export const spacing = {
  2: 2,
  4: 4,
  6: 6,
  8: 8,
  12: 12,
  16: 16,
  20: 20,
  24: 24,
  28: 28,
  32: 32,
  36: 36,
  40: 40,
  44: 44,
  48: 48,
  52: 52,
  56: 56,
  60: 60,
  64: 64,
  68: 68,
  72: 72,
  80: 80,
  96: 96,
  128: 128,
  192: 192,
} as const;
