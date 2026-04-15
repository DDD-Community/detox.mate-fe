/**
 * Border Radius Tokens
 *
 * 곡선도 짝수만 사용합니다.
 * 999는 pill/full-round 형태입니다.
 *
 * @example
 * import { radius } from 'src/lib/token';
 *
 * const styles = StyleSheet.create({
 *   card: { borderRadius: radius[12] },
 *   chip: { borderRadius: radius.full },
 *   input: { borderRadius: radius[8] },
 * });
 */
export const radius = {
  4: 4,
  8: 8,
  12: 12,
  16: 16,
  /** Pill / full-round shape */
  full: 999,
} as const;
