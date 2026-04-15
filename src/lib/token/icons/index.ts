/**
 * Icon Registry
 *
 * SVG 아이콘 파일은 src/assets/icons/ 에 저장합니다.
 * 이 파일은 아이콘 이름 레지스트리로, 타입 안전성을 제공합니다.
 *
 * ## 네이밍 컨벤션
 * - 파일명: kebab-case (예: ic-home.svg, ic-arrow-left.svg)
 * - 레지스트리 키: camelCase (예: home, arrowLeft)
 * - 파일 경로: src/assets/icons/{파일명}.svg
 *
 * ## 새 아이콘 추가 절차
 * 1. SVG 파일을 src/assets/icons/ 에 저장
 * 2. 이 파일의 iconNames 객체에 키-파일명 매핑 추가
 * 3. react-native-svg-transformer 등으로 import하여 사용
 *
 * @example
 * import { iconNames } from 'src/lib/token';
 *
 * // 아이콘 이름 타입 체크
 * const myIcon: IconName = 'home'; // ✅ 타입 안전
 * const bad: IconName = 'nonExistent'; // ❌ 컴파일 에러
 */

/**
 * 아이콘 이름 → 파일명 매핑
 *
 * SVG 파일을 src/assets/icons/ 에 추가한 후
 * 여기에 등록하면 타입 안전한 아이콘 참조가 가능합니다.
 *
 * @example
 * // 아이콘 추가 시:
 * // 1. src/assets/icons/ic-home.svg 파일 추가
 * // 2. 아래 객체에 추가: home: 'ic-home'
 */
export const iconNames = {
  // 아이콘 SVG 파일 추가 후 여기에 등록
  // home: 'ic-home',
  // search: 'ic-search',
  // arrowLeft: 'ic-arrow-left',
} as const;

/** 등록된 아이콘 이름 타입 */
export type IconName = keyof typeof iconNames;
