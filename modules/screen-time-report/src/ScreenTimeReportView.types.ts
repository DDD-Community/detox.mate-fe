import type { StyleProp, ViewStyle } from 'react-native';

export type ScreenTimeReportStyle =
  /** 카드 전체(총 사용 시간 헤더 + 앱별 목록) — 기존 전체 카드용. */
  | 'total'
  /** 숫자 한 줄만("N시간 N분 사용") — 상단 요약용. */
  | 'summary'
  /** 앱 하나짜리 리스트 행(아이콘 + 이름 + 시간 + 화살표) — 토큰 안에 앱이 정확히
   * 1개일 때만 쓸 것. 여러 개면 첫 번째 말고는 조용히 누락된다. */
  | 'appRow'
  /** 총합 타이틀 없이 앱별 행만 나열(아이콘 + 이름 + 시간 + 화살표, 몇 개든). 한
   * 등록 그룹에 앱이 1개든 여러 개든 전부 보여줘야 하는 lock status 리스트용. */
  | 'breakdown'
  /** 아이콘 + 이름만(시간 없음) — 앱 상세 화면 헤더용. 그룹 안 첫 번째 앱 기준. */
  | 'headerLabel'
  /** 큰 아이콘 + 이름 + 오늘 사용 시간 — 앱 상세 화면 상단용(앱 1개 토큰). */
  | 'hero'
  /** 오늘 제한 시간 중 사용 비율("60%") — 앱 상세 카드용. 제한 시간은 앱 그룹
   * UserDefaults("detox.targetMinutes")에서 읽는다(syncTargetMinutes 참고). */
  | 'percent'
  /** [임시] 커스텀 가능 범위를 보여주는 샘플 갤러리(스크롤 가능). */
  | 'showcase'
  /** 앱 이름("Instagram") 가운데 정렬 — 해제 시간 설정 화면 제목용(앱 1개 토큰). */
  | 'nameCenter'
  /** 이 앱의 오늘 사용 시간 막대 + "사용 시간 N분 / 제한 시간 M분" 라벨 — 해제 시간 설정 화면용
   * (앱 1개 토큰). 제한 시간은 앱 그룹 UserDefaults("detox.targetMinutes")에서 읽는다. */
  | 'usageBar';

export interface ScreenTimeReportViewProps {
  /** lockStore.familyActivitySelectionsByAppId 의 값들 (base64 FamilyActivitySelection 토큰). */
  selectionTokens: string[];
  /** 기본값 'total'. */
  reportStyle?: ScreenTimeReportStyle;
  style?: StyleProp<ViewStyle>;
}
