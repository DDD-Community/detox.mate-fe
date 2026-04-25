type MonthDay = {
  month: number;
  day: number;
};

type CalendarDate = MonthDay & {
  year: number;
};

type ActualYesterdayOptions = {
  now?: Date;
  timeZone?: string;
};

const ENGLISH_MONTH_LOOKUP: Record<string, number> = {
  jan: 1,
  january: 1,
  feb: 2,
  february: 2,
  mar: 3,
  march: 3,
  apr: 4,
  april: 4,
  may: 5,
  jun: 6,
  june: 6,
  jul: 7,
  july: 7,
  aug: 8,
  august: 8,
  sep: 9,
  sept: 9,
  september: 9,
  oct: 10,
  october: 10,
  nov: 11,
  november: 11,
  dec: 12,
  december: 12,
};

function resolvedTimeZone(timeZone?: string): string {
  return timeZone ?? Intl.DateTimeFormat().resolvedOptions().timeZone ?? 'UTC';
}

function getCalendarDateInTimeZone(date: Date, timeZone: string): CalendarDate {
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone,
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
  });

  const parts = formatter.formatToParts(date);
  const partValue = (type: 'year' | 'month' | 'day') =>
    Number(parts.find((part) => part.type === type)?.value);

  return {
    year: partValue('year'),
    month: partValue('month'),
    day: partValue('day'),
  };
}

function addCalendarDays(date: CalendarDate, days: number): CalendarDate {
  const utcDate = new Date(Date.UTC(date.year, date.month - 1, date.day));
  utcDate.setUTCDate(utcDate.getUTCDate() + days);

  return {
    year: utcDate.getUTCFullYear(),
    month: utcDate.getUTCMonth() + 1,
    day: utcDate.getUTCDate(),
  };
}

function parseKoreanSummaryDateLabel(dateLabel: string): MonthDay | null {
  const match = dateLabel.match(/어제,?\s*(\d{1,2})월\s*(\d{1,2})일/);
  if (!match) {
    return null;
  }

  return {
    month: Number(match[1]),
    day: Number(match[2]),
  };
}

function parseEnglishSummaryDateLabel(dateLabel: string): MonthDay | null {
  const match = dateLabel.match(/yesterday,?\s*([a-z]+)\s+(\d{1,2})/i);
  if (!match) {
    return null;
  }

  const month = ENGLISH_MONTH_LOOKUP[match[1].toLowerCase()];
  if (!month) {
    return null;
  }

  return {
    month,
    day: Number(match[2]),
  };
}

export function parseSummaryDateLabelMonthDay(dateLabel: string): MonthDay | null {
  return parseKoreanSummaryDateLabel(dateLabel) ?? parseEnglishSummaryDateLabel(dateLabel);
}

export function isSummaryDateLabelActualYesterday(
  dateLabel: string,
  { now = new Date(), timeZone }: ActualYesterdayOptions = {},
): boolean {
  const monthDay = parseSummaryDateLabelMonthDay(dateLabel);
  if (!monthDay) {
    return true;
  }

  const effectiveTimeZone = resolvedTimeZone(timeZone);
  const zonedToday = getCalendarDateInTimeZone(now, effectiveTimeZone);
  const actualYesterday = addCalendarDays(zonedToday, -1);
  const candidateYears = [zonedToday.year, zonedToday.year - 1];

  return candidateYears.some(
    (year) =>
      year === actualYesterday.year &&
      monthDay.month === actualYesterday.month &&
      monthDay.day === actualYesterday.day,
  );
}
