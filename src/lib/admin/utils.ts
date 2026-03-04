/**
 * Get the previous month string (e.g., "2026-03" → "2026-02")
 */
export function getPreviousMonth(month: string): string {
  const [year, m] = month.split('-').map(Number);
  const prevDate = new Date(year, m - 2, 1);
  return `${prevDate.getFullYear()}-${String(prevDate.getMonth() + 1).padStart(2, '0')}`;
}

/**
 * Get current month string (e.g., "2026-03")
 */
export function getCurrentMonth(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}
