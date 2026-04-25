export type ScreenTimeImageAnalysisFailureReason =
  | 'screen_not_matched'
  | 'date_not_yesterday'
  | 'summary_date_not_actual_yesterday'
  | 'summary_date_missing'
  | 'usage_not_found'
  | 'analysis_failed';

export type ScreenTimeImageAnalysisSuccess = {
  ok: true;
  value: string;
  dateLabel: string;
  rawUsageText: string;
  elapsedMs: number;
};

export type ScreenTimeImageAnalysisFailure = {
  ok: false;
  reason: ScreenTimeImageAnalysisFailureReason;
  dateLabel?: string;
  elapsedMs: number;
  message?: string;
};

export type ScreenTimeImageAnalysisResult =
  | ScreenTimeImageAnalysisSuccess
  | ScreenTimeImageAnalysisFailure;
