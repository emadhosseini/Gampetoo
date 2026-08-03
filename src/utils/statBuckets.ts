import type { DailyMetricEntry } from "./dailyMetricLog";
import { formatGregorianMonth, formatGregorianShort } from "./dateFormat";

export interface StatBucket {
  label: string;
  value: number | null;
}

function toIsoDate(date: Date): string {
  return date.toISOString().split("T")[0];
}

/**
 * One bucket per calendar day, oldest first, ending today — days with no
 * logged entry get `value: null` (a real gap, not interpolated) instead of
 * being skipped, so the chart always spans the full requested window
 * instead of shrinking to wherever the sparse data happens to be.
 */
export function buildDailyBuckets(history: DailyMetricEntry[], days: number): StatBucket[] {
  const byDate = new Map(history.map((entry) => [entry.date, entry.value]));
  const buckets: StatBucket[] = [];

  for (let i = days - 1; i >= 0; i--) {
    const date = new Date();

    date.setDate(date.getDate() - i);

    const iso = toIsoDate(date);

    buckets.push({ label: formatGregorianShort(date), value: byDate.get(iso) ?? null });
  }

  return buckets;
}

/**
 * One bucket per calendar month, oldest first, ending with the current
 * month — each bucket averages every entry logged that month (null if
 * none), used for the year range so ~365 daily points compress into 12.
 */
export function buildMonthlyBuckets(history: DailyMetricEntry[], months: number): StatBucket[] {
  const now = new Date();
  const buckets: StatBucket[] = [];

  for (let i = months - 1; i >= 0; i--) {
    const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${monthDate.getFullYear()}-${String(monthDate.getMonth() + 1).padStart(2, "0")}`;
    const values = history
      .filter((entry) => entry.date.startsWith(key))
      .map((entry) => entry.value);

    const value = values.length > 0 ? values.reduce((sum, v) => sum + v, 0) / values.length : null;

    buckets.push({ label: formatGregorianMonth(monthDate), value });
  }

  return buckets;
}
