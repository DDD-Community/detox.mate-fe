import type { OCRObservation, ParsedResult } from './ocrTypes';

export type ExtractedScreenTimeSummaryResult =
  | {
      ok: true;
      dateLabel: string;
      usageText: string;
    }
  | {
      ok: false;
      reason: 'screen_not_matched' | 'summary_date_missing' | 'usage_not_found';
      dateLabel?: string;
    };

type Rect = {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
};

function toRect(observation: OCRObservation): Rect {
  return {
    minX: observation.boundingBox.x,
    minY: observation.boundingBox.y,
    maxX: observation.boundingBox.x + observation.boundingBox.width,
    maxY: observation.boundingBox.y + observation.boundingBox.height,
  };
}

function midY(observation: OCRObservation): number {
  const rect = toRect(observation);
  return (rect.minY + rect.maxY) / 2;
}

function height(observation: OCRObservation): number {
  const rect = toRect(observation);
  return rect.maxY - rect.minY;
}

function normalizedWhitespace(text: string): string {
  return text.replace(/\s+/g, '');
}

function trimmedText(text: string): string {
  return text.trim();
}

function containsCalendarContext(text: string): boolean {
  if (/\d/.test(text)) {
    return true;
  }

  const monthTokens = [
    'jan',
    'feb',
    'mar',
    'apr',
    'may',
    'jun',
    'jul',
    'aug',
    'sep',
    'oct',
    'nov',
    'dec',
    'january',
    'february',
    'march',
    'april',
    'june',
    'july',
    'august',
    'september',
    'october',
    'november',
    'december',
    '월',
    '일',
  ];

  return monthTokens.some((token) => text.includes(token));
}

function isActionLabel(text: string): boolean {
  const compact = normalizedWhitespace(text.toLowerCase());
  return compact === 'showtoday' || compact === '오늘보기';
}

function isDateLikeText(observation: OCRObservation): boolean {
  const text = normalizedWhitespace(observation.text).toLowerCase();
  return (
    text.includes('어제') ||
    text.includes('오늘') ||
    text.includes('yesterday') ||
    text.includes('today')
  );
}

export function isYesterdayLabel(text: string): boolean {
  const value = normalizedWhitespace(text).toLowerCase();
  return value.includes('어제') || value.includes('yesterday');
}

function isUsageText(text: string): boolean {
  const value = normalizedWhitespace(text);
  return /^\d+시간\d+분$|^\d+시간$|^\d+분$|^\d+h(?:our|r|rs)?\d+m(?:in|ins|inute|inutes)?$|^\d+h(?:our|r|rs)?$|^\d+m(?:in|ins|inute|inutes)?$/.test(
    value,
  );
}

function screenTimeAnchor(observations: OCRObservation[]): OCRObservation | undefined {
  return observations.find((observation) => {
    const text = normalizedWhitespace(observation.text).toLowerCase();
    return text.includes('스크린타임') || text.includes('screentime');
  });
}

function isSummaryUsageCandidate(candidate: OCRObservation, anchor: OCRObservation): boolean {
  const candidateRect = toRect(candidate);
  const anchorRect = toRect(anchor);
  const verticalDistance = anchorRect.maxY - (candidateRect.minY + candidateRect.maxY) / 2;
  const horizontalDistance = Math.abs(candidateRect.minX - anchorRect.minX);

  return verticalDistance > 0 && verticalDistance <= 0.26 && horizontalDistance <= 0.14;
}

function usageScore(candidate: OCRObservation, anchor: OCRObservation): number {
  const candidateRect = toRect(candidate);
  const anchorRect = toRect(anchor);
  const verticalDistance = anchorRect.maxY - (candidateRect.minY + candidateRect.maxY) / 2;
  const horizontalDistance = Math.abs(candidateRect.minX - anchorRect.minX);
  const heightBonus = height(candidate);

  return verticalDistance + horizontalDistance - heightBonus;
}

function preferredSummaryUsageObservation(
  observations: OCRObservation[],
  anchor: OCRObservation,
): OCRObservation | undefined {
  return observations
    .filter((observation) => isUsageText(observation.text))
    .filter((observation) => isSummaryUsageCandidate(observation, anchor))
    .sort((left, right) => usageScore(left, anchor) - usageScore(right, anchor))[0];
}

function isSummaryDateCandidate(
  candidate: OCRObservation,
  anchor: OCRObservation,
  usage: OCRObservation,
): boolean {
  const candidateMidY = midY(candidate);
  const usageMidY = midY(usage);
  const anchorMidY = midY(anchor);
  const candidateRect = toRect(candidate);
  const usageRect = toRect(usage);
  const horizontalDistance = Math.abs(candidateRect.minX - usageRect.minX);
  const verticalDistance = candidateMidY - usageMidY;
  const isBetweenAnchorAndUsage = candidateMidY < anchorMidY && candidateMidY > usageMidY;

  return (
    isBetweenAnchorAndUsage && verticalDistance <= 0.14 && horizontalDistance <= 0.18
  );
}

function summaryDateScore(candidate: OCRObservation, usage: OCRObservation): number {
  const normalized = normalizedWhitespace(candidate.text).toLowerCase();
  const candidateRect = toRect(candidate);
  const usageRect = toRect(usage);
  const verticalDistance = midY(candidate) - midY(usage);
  const horizontalDistance = Math.abs(candidateRect.minX - usageRect.minX);
  const calendarPenalty = containsCalendarContext(normalized) ? 0 : 10;

  return calendarPenalty + horizontalDistance + Math.abs(0.08 - verticalDistance);
}

function preferredSummaryDateObservation(
  observations: OCRObservation[],
  anchor: OCRObservation,
  usage: OCRObservation,
): OCRObservation | undefined {
  return observations
    .filter(isDateLikeText)
    .filter((observation) => !isActionLabel(observation.text))
    .filter((observation) => isSummaryDateCandidate(observation, anchor, usage))
    .sort((left, right) => summaryDateScore(left, usage) - summaryDateScore(right, usage))[0];
}

function isLooseDateCandidate(candidate: OCRObservation, anchor: OCRObservation): boolean {
  const candidateRect = toRect(candidate);
  const anchorRect = toRect(anchor);
  const verticalDistance = anchorRect.maxY - (candidateRect.minY + candidateRect.maxY) / 2;
  const horizontalDistance = Math.abs(candidateRect.minX - anchorRect.minX);

  return verticalDistance > 0 && verticalDistance <= 0.18 && horizontalDistance <= 0.18;
}

function looseDateScore(candidate: OCRObservation, anchor: OCRObservation): number {
  const normalized = normalizedWhitespace(candidate.text).toLowerCase();
  const candidateRect = toRect(candidate);
  const anchorRect = toRect(anchor);
  const verticalDistance = anchorRect.maxY - (candidateRect.minY + candidateRect.maxY) / 2;
  const horizontalDistance = Math.abs(candidateRect.minX - anchorRect.minX);
  const calendarPenalty = containsCalendarContext(normalized) ? 0 : 10;

  return calendarPenalty + horizontalDistance + Math.abs(0.08 - verticalDistance);
}

function preferredDateObservationWithoutUsage(
  observations: OCRObservation[],
  anchor: OCRObservation,
): OCRObservation | undefined {
  return observations
    .filter(isDateLikeText)
    .filter((observation) => !isActionLabel(observation.text))
    .filter((observation) => isLooseDateCandidate(observation, anchor))
    .sort((left, right) => looseDateScore(left, anchor) - looseDateScore(right, anchor))[0];
}

export function extractScreenTimeSummary(
  observations: OCRObservation[],
): ExtractedScreenTimeSummaryResult {
  const anchor = screenTimeAnchor(observations);
  if (!anchor) {
    return { ok: false, reason: 'screen_not_matched' };
  }

  const usageObservation = preferredSummaryUsageObservation(observations, anchor);
  if (!usageObservation) {
    const dateLabel = preferredDateObservationWithoutUsage(observations, anchor)?.text.trim();
    return dateLabel
      ? { ok: false, reason: 'usage_not_found', dateLabel }
      : { ok: false, reason: 'usage_not_found' };
  }

  const dateObservation = preferredSummaryDateObservation(observations, anchor, usageObservation);
  if (!dateObservation) {
    return { ok: false, reason: 'summary_date_missing' };
  }

  return {
    ok: true,
    dateLabel: trimmedText(dateObservation.text),
    usageText: trimmedText(usageObservation.text),
  };
}

export function parseScreenTimeSummary(observations: OCRObservation[]): ParsedResult {
  const extractedResult = extractScreenTimeSummary(observations);
  if (!extractedResult.ok) {
    return extractedResult;
  }

  const { dateLabel, usageText } = extractedResult;
  if (!isYesterdayLabel(dateLabel)) {
    return { ok: false, reason: 'date_not_yesterday', dateLabel };
  }

  return {
    ok: true,
    dateLabel,
    usageText,
  };
}
