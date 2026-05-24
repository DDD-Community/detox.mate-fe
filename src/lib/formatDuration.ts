export function formatMinutesAsHourMinute(totalMinutes: number | null | undefined): string {
  const safeMinutes = Math.max(0, totalMinutes ?? 0);
  const hours = Math.floor(safeMinutes / 60);
  const minutes = safeMinutes % 60;

  return `${hours}h ${String(minutes).padStart(2, '0')}m`;
}
