export type UIProfile = 'legacy' | 'liquid-glass';
export type LocaleCode = 'ko' | 'en';

export type OCRBoundingBox = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export type OCRObservation = {
  text: string;
  confidence: number;
  boundingBox: OCRBoundingBox;
};

export type OCRResult = {
  imageWidth: number;
  imageHeight: number;
  elapsedMs: number;
  observations: OCRObservation[];
};

export type ParsedResult =
  | {
      ok: true;
      dateLabel: string;
      usageText: string;
    }
  | {
      ok: false;
      reason:
        | 'screen_not_matched'
        | 'date_not_yesterday'
        | 'summary_date_missing'
        | 'usage_not_found';
      dateLabel?: string;
    };

export type FixtureDefinition = {
  id: string;
  label: string;
  asset: number;
  uiProfile: UIProfile;
  locale: LocaleCode;
};

export type ExpectedResult =
  | {
      fixtureId: string;
      expectedStatus: 'ok';
      expectedDateLabel: string;
      expectedUsageText: string;
    }
  | {
      fixtureId: string;
      expectedStatus: 'reject';
      expectedReason:
        | 'screen_not_matched'
        | 'date_not_yesterday'
        | 'summary_date_missing'
        | 'usage_not_found';
    };

export type ComparisonResult = {
  pass: boolean;
  mismatchReason: string | null;
};

export type FixtureRun = {
  fixtureId: string;
  runIndex: number;
  imageUri: string;
  ocrResult: OCRResult;
  parsedResult: ParsedResult;
  pass: boolean;
  mismatchReason: string | null;
};

export type SuiteRunMode = 'single' | 'repeat5' | 'all';

export type SuiteSummary = {
  totalRuns: number;
  passedRuns: number;
  failedRuns: number;
};

export type StoredSuite = {
  suiteId: string;
  createdAt: string;
  runMode: SuiteRunMode;
  deviceModel: string;
  iosVersion: string;
  runs: FixtureRun[];
  summary: SuiteSummary;
};
