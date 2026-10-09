/**
 * 앱 선택 화면에서 "완료"를 눌렀을 때, 등록돼 있었는데 이번 최종 선택에서 빠진(체크 해제된) 앱의
 * id만 골라낸다. 최종 선택이 비어 있으면(null) 등록된 앱 전부가 해제된 것이다.
 * 겹침 판단(overlaps)은 네이티브 집합 연산이라 호출부에서 넘긴다.
 */
export const findDeselectedAppIds = (
  registeredTokensByAppId: Record<string, string>,
  finalSelectionToken: string | null,
  overlaps: (registeredToken: string, selectionToken: string) => boolean
): string[] =>
  Object.entries(registeredTokensByAppId)
    .filter(([, token]) => !finalSelectionToken || !overlaps(token, finalSelectionToken))
    .map(([appId]) => appId);
