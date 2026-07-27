import { isTestAccountSession } from '@/api/auth';

import { buildScreenTimeAnalysisSuccess } from './mockScreenTimeAnalysis';
import type { ScreenTimeImageAnalysisSuccess } from './types';

// 테스트 계정(앱스토어 심사용)은 실제 스크린타임 캡쳐를 만들 수 없으므로,
// OCR 검증을 건너뛰고 항상 성공 결과를 반환한다. 일반 유저 세션에는 영향이 없다.
const TEST_ACCOUNT_BYPASS_USAGE = '02:00';

export async function getTestAccountAnalysisBypass(): Promise<ScreenTimeImageAnalysisSuccess | null> {
  const isTestAccount = await isTestAccountSession();
  if (!isTestAccount) {
    return null;
  }

  return buildScreenTimeAnalysisSuccess(TEST_ACCOUNT_BYPASS_USAGE);
}
