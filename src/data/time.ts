const DAY = 24 * 60 * 60 * 1000;

/** ISO timestamp `days` days before now (fractions allowed). */
export const daysAgo = (days: number, now = Date.now()) => new Date(now - days * DAY).toISOString();

/** ISO timestamp `days` days after now. */
export const daysFromNow = (days: number, now = Date.now()) => new Date(now + days * DAY).toISOString();

export const monthKey = (date = new Date()) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

export function periodBounds(period: 'monthly' | 'quarterly' | 'annual', now = new Date()) {
  const y = now.getFullYear();
  const m = now.getMonth();
  if (period === 'monthly') return [new Date(y, m, 1), new Date(y, m + 1, 0, 23, 59)] as const;
  if (period === 'quarterly') {
    const q = Math.floor(m / 3) * 3;
    return [new Date(y, q, 1), new Date(y, q + 3, 0, 23, 59)] as const;
  }
  return [new Date(y, 0, 1), new Date(y, 11, 31, 23, 59)] as const;
}
