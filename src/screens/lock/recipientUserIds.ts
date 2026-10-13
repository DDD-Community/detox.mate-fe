/** 화면 사이 라우트 파라미터로 넘기는 알림 수신자 ID 목록(쉼표 구분)을 숫자 배열로 읽는다. */
export const parseRecipientUserIds = (value?: string): number[] =>
  (value ?? '').split(',').filter(Boolean).map(Number).filter(Number.isSafeInteger);
