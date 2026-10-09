import { getTransferPhrase } from '../../api/generated/transfer-phrase/transfer-phrase';

/**
 * 서버 호출이 실패했을 때(문구 미등록 404, 네트워크 오류 등) 대신 쓰는 문구.
 * 화면이 빈 채로 막히지 않게 하는 용도다.
 */
const FALLBACK_SENTENCES = [
  '오늘도 목표를 지켜낼 거예요',
  'The best thing about me is I am not afraid to fail',
];

const pickFallback = () =>
  FALLBACK_SENTENCES[Math.floor(Math.random() * FALLBACK_SENTENCES.length)];

/**
 * 목표 시간을 "완화(변경)"할 때 따라 써야 하는 문구. 서버(GET /transfer-phrases/random)에서
 * 무작위로 하나 받아오고, 실패하거나 빈 문구가 오면 로컬 폴백을 쓴다. 서버 값 앞뒤에
 * 공백이 섞여 올 수 있어 trim 한다. (파일명은 mock 시절 그대로 — 호출부 변경 회피용)
 */
export const fetchGoalChangeChallengeSentence = async (): Promise<string> => {
  try {
    const { phrase } = await getTransferPhrase().getRandom();
    return phrase?.trim() || pickFallback();
  } catch {
    return pickFallback();
  }
};
