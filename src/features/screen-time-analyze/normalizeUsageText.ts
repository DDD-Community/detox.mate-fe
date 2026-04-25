function pad(value: number): string {
  return value.toString().padStart(2, '0');
}

function extractKoreanUsageParts(compact: string): { hours: number; minutes: number } | null {
  const match = compact.match(/^(?:(\d+)시간)?(?:(\d+)분)?$/);
  if (!match) {
    return null;
  }

  const hours = Number(match[1] ?? 0);
  const minutes = Number(match[2] ?? 0);
  return { hours, minutes };
}

function extractEnglishUsageParts(compact: string): { hours: number; minutes: number } | null {
  const match = compact.match(/^(?:(\d+)h(?:our|r|rs)?)?(?:(\d+)m(?:in|ins|inute|inutes)?)?$/i);
  if (!match) {
    return null;
  }

  const hours = Number(match[1] ?? 0);
  const minutes = Number(match[2] ?? 0);
  return { hours, minutes };
}

export function normalizeUsageTextToHHMM(usageText: string): string {
  const compact = usageText.replace(/\s+/g, '');
  const parts = extractKoreanUsageParts(compact) ?? extractEnglishUsageParts(compact);

  if (!parts) {
    throw new Error(`Unsupported usage text format: ${usageText}`);
  }

  const totalMinutes = parts.hours * 60 + parts.minutes;
  const normalizedHours = Math.floor(totalMinutes / 60);
  const normalizedMinutes = totalMinutes % 60;

  return `${pad(normalizedHours)}:${pad(normalizedMinutes)}`;
}
