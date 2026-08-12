import type { DailyMetricEntry } from "./dailyMetricLog";
import { formatDisplayDayNumber, formatMonthNumber, toLocalDateString } from "./dateFormat";

export interface StatBucket {
  label: string;
  value: number | null;
}

/**
 * How a day with no logged entry should be read.
 *
 * - "gap" (weight): the metric is a point-in-time measurement, so a
 *   missing day means "didn't weigh in" — it's a real hole in the line,
 *   and a monthly figure averages only the days actually measured.
 * - "zero" (calories, activity): the metric is a daily total, so a
 *   missing day means the total was zero. Drawing those as holes broke
 *   the line wherever nothing was logged, and averaging only the logged
 *   days reported a month where you logged three days as if every day of
 *   it had looked like those three.
 */
export type MissingDayMeaning = "gap" | "zero";

/**
 * One bucket per calendar day, oldest first, ending today — days with no
 * logged entry become a gap or a zero depending on `missingDays` (see
 * MissingDayMeaning), rather than being skipped, so the chart always spans
 * the full requested window instead of shrinking to wherever the sparse
 * data happens to be.
 */
export function buildDailyBuckets(
  history: DailyMetricEntry[],
  days: number,
  missingDays: MissingDayMeaning = "gap",
  // How many days back from today the window's own last day sits — 0 (the
  // default) ends today, same as before this existed. A dragged/panned
  // chart (see StatChartPage) passes a positive offset to slide the whole
  // window into the past without changing `days` (the window's width).
  endOffsetDays = 0,
): StatBucket[] {
  const byDate = new Map(history.map((entry) => [entry.date, entry.value]));
  const buckets: StatBucket[] = [];
  const fallback = missingDays === "zero" ? 0 : null;

  for (let i = days - 1; i >= 0; i--) {
    const date = new Date();

    date.setDate(date.getDate() - i - endOffsetDays);

    const iso = toLocalDateString(date);

    buckets.push({ label: formatDisplayDayNumber(date), value: byDate.get(iso) ?? fallback });
  }

  return buckets;
}

// How many days of `monthDate`'s month have actually happened — the whole
// month for a past one, only the days so far for the current one. Dividing
// by this (rather than by the number of logged days) is what makes a
// daily-total metric's monthly figure a real per-day average.
function elapsedDaysInMonth(monthDate: Date, now: Date): number {
  const isCurrentMonth =
    monthDate.getFullYear() === now.getFullYear() &&
    monthDate.getMonth() === now.getMonth();

  if (isCurrentMonth) return now.getDate();

  return new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0).getDate();
}

/**
 * One bucket per calendar month, oldest first, ending with the current
 * month — used by the 6-month and year ranges so long spans compress into
 * one point per month. A month with nothing logged at all stays null (no
 * data, as opposed to a real zero), so months from before the user started
 * using the app don't draw a misleading flat line.
 */
// Deliberately still Gregorian-only (formatMonthNumber, not the calendar-
// aware formatDisplayMonthNumber): the grouping below buckets entries by
// Gregorian calendar month (the `key` a few lines down), and Jalali month
// boundaries don't line up with Gregorian ones — relabeling with a Jalali
// month number would put the wrong number on a bucket whose actual data
// is grouped by Gregorian months. Properly supporting a Jalali-bucketed
// 6-month/year view means re-grouping by Jalali month, not just
// relabeling, which is out of scope for now.
export function buildMonthlyBuckets(
  history: DailyMetricEntry[],
  months: number,
  missingDays: MissingDayMeaning = "gap",
): StatBucket[] {
  const now = new Date();
  const buckets: StatBucket[] = [];

  for (let i = months - 1; i >= 0; i--) {
    const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${monthDate.getFullYear()}-${String(monthDate.getMonth() + 1).padStart(2, "0")}`;
    const values = history
      .filter((entry) => entry.date.startsWith(key))
      .map((entry) => entry.value);

    if (values.length === 0) {
      buckets.push({ label: formatMonthNumber(monthDate), value: null });
      continue;
    }

    const total = values.reduce((sum, v) => sum + v, 0);
    const divisor =
      missingDays === "zero" ? elapsedDaysInMonth(monthDate, now) : values.length;

    buckets.push({
      label: formatMonthNumber(monthDate),
      value: divisor > 0 ? total / divisor : null,
    });
  }

  return buckets;
}
