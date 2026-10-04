import * as ReactNativeDeviceActivity from 'react-native-device-activity';

/**
 * FamilyActivitySelection 토큰은 암호화된 블롭이라 JS에서 직접 합치거나 비교할 수
 * 없다. 대신 react-native-device-activity가 네이티브에서 집합 연산(union/difference)을
 * 대신 해주는 함수를 제공한다 — 그 결과로 나오는 새 토큰 + 개수 메타데이터만 받는다.
 */

const hasAnyItem = (metadata: { applicationCount: number; categoryCount: number; webDomainCount: number }) =>
  metadata.applicationCount + metadata.categoryCount + metadata.webDomainCount > 0;

/**
 * 여러 개의 FamilyActivitySelection 토큰을 하나로 합친다. 앱 선택 피커를 다시 열 때
 * "지금까지 잠근 앱 전체"를 미리 체크된 상태로 보여주기 위해 쓴다.
 */
export const unionTokens = (tokens: string[]): string | null => {
  if (tokens.length === 0) return null;

  return tokens.reduce<string | null>((acc, token) => {
    if (acc === null) return token;
    const result = ReactNativeDeviceActivity.union(
      { activitySelectionToken: acc },
      { activitySelectionToken: token }
    );
    return result?.familyActivitySelection ?? acc;
  }, null);
};

/**
 * a에는 있고 b에는 없는 것들(= a 기준으로 b를 뺀 차집합)이 하나라도 있으면 그 결과
 * 토큰을, 없으면 null을 돌려준다.
 */
export const differenceTokens = (a: string, b: string): string | null => {
  const result = ReactNativeDeviceActivity.difference(
    { activitySelectionToken: a },
    { activitySelectionToken: b }
  );
  if (!result || !result.familyActivitySelection || !hasAnyItem(result)) return null;
  return result.familyActivitySelection;
};

/**
 * 두 선택이 겹치는 부분이 하나라도 있는지(교집합이 비어있지 않은지) 확인한다.
 * 특정 등록 그룹의 토큰이 "방금 피커에서 체크 해제된 것들" 안에 포함되는지 볼 때 쓴다.
 */
export const tokensOverlap = (a: string, b: string): boolean => {
  const result = ReactNativeDeviceActivity.intersection(
    { activitySelectionToken: a },
    { activitySelectionToken: b }
  );
  return !!result && hasAnyItem(result);
};

/**
 * 토큰 하나에 앱/카테고리/웹사이트가 합쳐서 몇 개 들어있는지. 한 번에 여러 개를
 * 선택했는지(= 등록 그룹 하나에 여러 실제 앱이 섞이는지) 걸러낼 때 쓴다.
 */
export const getSelectionItemCount = (token: string): number => {
  const result = ReactNativeDeviceActivity.activitySelectionMetadata({
    activitySelectionToken: token,
  });
  if (!result) return 0;
  return result.applicationCount + result.categoryCount + result.webDomainCount;
};
