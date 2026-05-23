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

export function getMockScreenTimeAnalysisResult(): ScreenTimeImageAnalysisSuccess | null {
  if (process.env.EXPO_PUBLIC_MOCK_SCREEN_TIME_ANALYSIS !== 'true') {
    return null;
  }

  const value = normalizeMockValue(process.env.EXPO_PUBLIC_MOCK_SCREEN_TIME_ANALYSIS_VALUE);

  return {
    ok: true,
    value,
    dateLabel: '어제',
    rawUsageText: formatRawUsageText(value),
    elapsedMs: 0,
  };
}
