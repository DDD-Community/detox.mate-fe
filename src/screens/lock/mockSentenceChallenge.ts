/**
 * 목표 시간을 "완화(변경)"할 때 따라 써야 하는 문장. 백엔드에 아직 전용 API가
 * 없어서(2026-10-04 기준 swagger에 없음) 테스트용으로 한글/영어 한 문장씩만
 * 고정해두고 둘 중 하나를 무작위로 고른다 — 백엔드가 엔드포인트를 만들면 이 함수
 * 내부만 실제 fetch 호출로 교체하면 된다(호출부는 그대로 둬도 됨).
 */
const TEST_SENTENCES = [
  '오늘도 목표를 지켜낼 거예요',
  'The best thing about me is I am not afraid to fail',
];

export const fetchGoalChangeChallengeSentence = async (): Promise<string> => {
  return TEST_SENTENCES[Math.floor(Math.random() * TEST_SENTENCES.length)];
};
