export function parseHHMMToMinutes(value: string | undefined): number | null {
  if (!value) return null;

  const [hStr, mStr] = value.split(':');
  const h = Number(hStr ?? 0);
  const m = Number(mStr ?? 0);

  if (Number.isNaN(h) || Number.isNaN(m)) return null;
  return h * 60 + m;
}

export function formatHHMMToDisplay(value: string | undefined): string {
  if (!value) return '';

  const [hStr, mStr] = value.split(':');
  return `${Number(hStr ?? 0)}h ${Number(mStr ?? 0)}m`;
}

export function formatMinutesAsGoal(totalMinutes: number): string {
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  return `${h}h ${m.toString().padStart(2, '0')}m`;
}

export function formatMinutesDiff(minutes: number): string {
  const abs = Math.abs(minutes);
  const h = Math.floor(abs / 60);
  const m = abs % 60;

  if (h && m) return `${h}시간 ${m}분`;
  if (h) return `${h}시간`;
  return `${m}분`;
}
