import type { OCRResult } from './ocrTypes';
import { extractScreenTimeSummary, isYesterdayLabel } from './parser';
import { normalizeUsageTextToHHMM } from './normalizeUsageText';
import { isSummaryDateLabelActualYesterday } from './summaryDate';
import type { ScreenTimeImageAnalysisResult } from './types';
import { getMockScreenTimeAnalysisResult } from './mockScreenTimeAnalysis';
import { getTestAccountAnalysisBypass } from './testAccountAnalysisBypass';

type AnalyzeScreenTimeImageDeps = {
  recognizeText?: (imageUri: string) => Promise<OCRResult>;
  now?: Date;
  timeZone?: string;
};

async function defaultRecognizeText(imageUri: string): Promise<OCRResult> {
  const { recognizeText } = await import('./nativeOcr');
  return recognizeText(imageUri, {
    recognitionLanguages: ['ko-KR', 'en-US'],
    recognitionLevel: 'accurate',
    usesLanguageCorrection: false,
  });
}

export async function analyzeScreenTimeImage(
  imageUri: string,
  deps: AnalyzeScreenTimeImageDeps = {}
): Promise<ScreenTimeImageAnalysisResult> {
  const mockResult = getMockScreenTimeAnalysisResult();
  if (mockResult) {
    return mockResult;
  }

  // 테스트 계정 세션이면 OCR 검증을 건너뛴다. (앱스토어 심사용)
  const testAccountBypass = await getTestAccountAnalysisBypass();
  if (testAccountBypass) {
    return testAccountBypass;
  }

  const runRecognizeText = deps.recognizeText ?? defaultRecognizeText;
  const now = deps.now ?? new Date();
  const timeZone = deps.timeZone;

  try {
    const ocrResult = await runRecognizeText(imageUri);
    const extractedResult = extractScreenTimeSummary(ocrResult.observations);

    if (!extractedResult.ok) {
      return {
        ok: false,
        reason: extractedResult.reason,
        dateLabel: extractedResult.dateLabel,
        elapsedMs: ocrResult.elapsedMs,
      };
    }

    if (!isYesterdayLabel(extractedResult.dateLabel)) {
      return {
        ok: false,
        reason: 'date_not_yesterday',
        dateLabel: extractedResult.dateLabel,
        elapsedMs: ocrResult.elapsedMs,
      };
    }

    if (
      !isSummaryDateLabelActualYesterday(extractedResult.dateLabel, {
        now,
        timeZone,
      })
    ) {
      return {
        ok: false,
        reason: 'summary_date_not_actual_yesterday',
        dateLabel: extractedResult.dateLabel,
        elapsedMs: ocrResult.elapsedMs,
      };
    }

    return {
      ok: true,
      value: normalizeUsageTextToHHMM(extractedResult.usageText),
      dateLabel: extractedResult.dateLabel,
      rawUsageText: extractedResult.usageText,
      elapsedMs: ocrResult.elapsedMs,
    };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : '스크린 타임 이미지 스캔에 실패했습니다.';

    return {
      ok: false,
      reason: 'analysis_failed',
      elapsedMs: 0,
      message,
    };
  }
}
