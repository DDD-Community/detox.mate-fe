import { parseScreenTimeSummary } from './parser';
import type {
  ComparisonResult,
  ExpectedResult,
  FixtureRun,
  OCRResult,
  ParsedResult,
  StoredSuite,
  SuiteRunMode,
} from './types';

export function compareAgainstExpected(
  actual: ParsedResult,
  expected: ExpectedResult,
): ComparisonResult {
  if (expected.expectedStatus === 'ok') {
    if (!actual.ok) {
      return {
        pass: false,
        mismatchReason: `expected success but got reject ${actual.reason}`,
      };
    }

    if (actual.dateLabel !== expected.expectedDateLabel) {
      return {
        pass: false,
        mismatchReason: `expected dateLabel ${expected.expectedDateLabel} but got ${actual.dateLabel}`,
      };
    }

    if (actual.usageText !== expected.expectedUsageText) {
      return {
        pass: false,
        mismatchReason: `expected usageText ${expected.expectedUsageText} but got ${actual.usageText}`,
      };
    }

    return { pass: true, mismatchReason: null };
  }

  if (actual.ok) {
    return {
      pass: false,
      mismatchReason: `expected reject ${expected.expectedReason} but got success`,
    };
  }

  if (actual.reason !== expected.expectedReason) {
    return {
      pass: false,
      mismatchReason: `expected reject reason ${expected.expectedReason} but got ${actual.reason}`,
    };
  }

  return { pass: true, mismatchReason: null };
}

type RunFixtureOnceParams = {
  fixtureId: string;
  imageUri: string;
  runIndex: number;
  expected: ExpectedResult;
  recognizeText: (imageUri: string) => Promise<OCRResult>;
};

export async function runFixtureOnce({
  fixtureId,
  imageUri,
  runIndex,
  expected,
  recognizeText,
}: RunFixtureOnceParams): Promise<FixtureRun> {
  const ocrResult = await recognizeText(imageUri);
  const parsedResult = parseScreenTimeSummary(ocrResult.observations);
  const comparison = compareAgainstExpected(parsedResult, expected);

  return {
    fixtureId,
    runIndex,
    imageUri,
    ocrResult,
    parsedResult,
    pass: comparison.pass,
    mismatchReason: comparison.mismatchReason,
  };
}

export function summarizeRuns(runs: FixtureRun[]) {
  const passedRuns = runs.filter((run) => run.pass).length;

  return {
    totalRuns: runs.length,
    passedRuns,
    failedRuns: runs.length - passedRuns,
  };
}

export function buildStoredSuite(params: {
  suiteId: string;
  createdAt: string;
  runMode: SuiteRunMode;
  deviceModel: string;
  iosVersion: string;
  runs: FixtureRun[];
}): StoredSuite {
  return {
    ...params,
    summary: summarizeRuns(params.runs),
  };
}
