import { scopedKey } from "./userEngine";
import { getTodayLocalDate } from "./dateFormat";

// A date -> single-number history, the shared shape behind water, activity,
// and the daily-calorie archive — each is otherwise identical (per-day
// total, queried as a time series for a chart), so this one factory backs
// all three instead of copy-pasting the same read/write logic three times.
export interface DailyMetricEntry {
  date: string;
  value: number;
}

const today = getTodayLocalDate;

export function createDailyMetricLog(storageKey: string) {
  function key() {
    return scopedKey(storageKey);
  }

  function getHistory(): DailyMetricEntry[] {
    const saved = localStorage.getItem(key());

    if (!saved) return [];

    try {
      return JSON.parse(saved) as DailyMetricEntry[];
    } catch {
      return [];
    }
  }

  function saveHistory(history: DailyMetricEntry[]) {
    localStorage.setItem(key(), JSON.stringify(history));
  }

  function getToday(): number {
    return getHistory().find((entry) => entry.date === today())?.value ?? 0;
  }

  // Upsert an arbitrary date's total — used both for "add to today" and for
  // archiving a past day's final value (see dailyLogEngine.ts's calorie
  // history, which writes a day's total once it's no longer today).
  function setEntry(date: string, value: number) {
    const history = getHistory();
    const idx = history.findIndex((entry) => entry.date === date);

    if (idx >= 0) {
      history[idx] = { date, value };
    } else {
      history.push({ date, value });
    }

    saveHistory(history);
  }

  function addToday(amount: number): DailyMetricEntry[] {
    setEntry(today(), getToday() + amount);
    return getHistory();
  }

  // Replaces today's total outright rather than adding to it — for a metric
  // that's written once as a finished figure (the workout's calorie estimate,
  // committed when the workout is completed) instead of accumulated event by
  // event. Being idempotent is the point: doing it twice can't double it.
  function setToday(value: number): DailyMetricEntry[] {
    setEntry(today(), value);
    return getHistory();
  }

  function reset() {
    localStorage.removeItem(key());
  }

  return { getHistory, getToday, setEntry, setToday, addToday, reset };
}

// Combines two independent daily-metric histories (e.g. workout-derived and
// manually-logged activity calories — see ActivityDetailPage) into one
// summed-per-date series, so a chart built on the result reflects the same
// combined total shown elsewhere (the progress-page tile, the details card
// underneath the chart) instead of just one of the two sources.
export function mergeDailyMetricHistories(
  a: DailyMetricEntry[],
  b: DailyMetricEntry[],
): DailyMetricEntry[] {
  const totals = new Map<string, number>();

  for (const entry of [...a, ...b]) {
    totals.set(entry.date, (totals.get(entry.date) ?? 0) + entry.value);
  }

  return Array.from(totals, ([date, value]) => ({ date, value })).sort(
    (x, y) => (x.date < y.date ? -1 : x.date > y.date ? 1 : 0),
  );
}
