import type { ScreenTimeImageAnalysisSuccess } from './types';

const DEFAULT_MOCK_VALUE = '02:00';

function normalizeMockValue(value: string | undefined): string {
  const match = value?.trim().match(/^(\d{1,2}):([0-5]\d)$/);
  if (!match) return DEFAULT_MOCK_VALUE;

  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
}

function formatRawUsageText(value: string): string {
  const [hours, minutes] = value.split(':').map(Number);
  return `${hours}시간 ${minutes}분`;
}

// OCR을 거치지 않고 주어진 사용시간으로 "어제" 성공 결과를 만든다.
// 빌드 env 목업과 테스트 계정 우회가 공통으로 사용한다.
export function buildScreenTimeAnalysisSuccess(
  value: string | undefined
): ScreenTimeImageAnalysisSuccess {
  const normalized = normalizeMockValue(value);

  return {
    ok: true,
    value: normalized,
    dateLabel: '어제',
    rawUsageText: formatRawUsageText(normalized),
    elapsedMs: 0,
  };
}

export function getMockScreenTimeAnalysisResult(): ScreenTimeImageAnalysisSuccess | null {
  if (process.env.EXPO_PUBLIC_MOCK_SCREEN_TIME_ANALYSIS !== 'true') {
    return null;
  }

  return buildScreenTimeAnalysisSuccess(process.env.EXPO_PUBLIC_MOCK_SCREEN_TIME_ANALYSIS_VALUE);
}
