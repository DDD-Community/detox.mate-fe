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
