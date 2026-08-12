import { getCalorieHistory, getCalorieTarget } from "./dailyLogEngine";
import { getWorkoutCalorieHistory } from "./workoutCalorieEngine";
import { getActivityHistory } from "./activityLogEngine";
import { mergeDailyMetricHistories, type DailyMetricEntry } from "./dailyMetricLog";
import { getAppSettings, weekStartDayNumber } from "./appSettingsEngine";
import { toLocalDateString } from "./dateFormat";

// Per-day "how much of the allowed calorie budget was left" — target minus
// what was eaten plus what was burned, the exact same formula
// CalorieOrbCard's own "باقیمانده" figure uses for today, just replayed
// across every day that has either a food or a burned-calorie entry. A
// positive value means that day finished under budget, negative means over
// — this is deliberately allowed to go negative (see StatChartPage's
// signedBars), since a day that overate or under-burned is a real, useful
// thing to show, not something to clamp away.
//
// The daily target itself has no history of its own (see dailyLogEngine's
// TARGET_KEY) — it's a single number the user can change at any time, with
// past values simply lost. So this reads today's current target and applies
// it retroactively to every past day too, which is an approximation for
// anyone who has ever changed their goal, not a record of what the goal
// actually was on each of those days.
export function getCalorieBudgetHistory(): DailyMetricEntry[] {
  const target = getCalorieTarget();

  if (target === null) return [];

  const consumed = getCalorieHistory();
  const burned = mergeDailyMetricHistories(getWorkoutCalorieHistory(), getActivityHistory());

  const consumedByDate = new Map(consumed.map((entry) => [entry.date, entry.value]));
  const burnedByDate = new Map(burned.map((entry) => [entry.date, entry.value]));

  const dates = new Set([...consumedByDate.keys(), ...burnedByDate.keys()]);

  return Array.from(dates, (date) => ({
    date,
    value: target - (consumedByDate.get(date) ?? 0) + (burnedByDate.get(date) ?? 0),
  })).sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));
}

export interface CalorieBudgetSummary {
  // Sum of the per-day budget figure across the window's days that
  // actually have a value — positive means the window finished under
  // budget overall, negative means over. Only real days count (see
  // daysCounted); a day with nothing logged and nothing burned is left out
  // entirely rather than assumed to be a perfect zero-surplus day.
  total: number;
  daysCounted: number;
}

// The most recently FINISHED week/month, not the one still in progress —
// summing "این هفته" while it's only half over reads as if the user fell
// short, when really most of the week just hasn't happened yet. So this
// always looks one full period back: the last complete calendar week (per
// "روز شروع هفته"), or the 30 days immediately before the current rolling
// 30-day window.
export function getCalorieBudgetSummary(range: "week" | "month"): CalorieBudgetSummary {
  const history = getCalorieBudgetHistory();
  const byDate = new Map(history.map((entry) => [entry.date, entry.value]));

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const start = new Date(today);
  const end = new Date(today);

  if (range === "week") {
    const weekStartDay = weekStartDayNumber(getAppSettings().weekStart);
    const daysSinceStart = (today.getDay() - weekStartDay + 7) % 7;

    // The current (incomplete) week starts here — the previous, complete
    // week is the 7 days right before that.
    start.setDate(today.getDate() - daysSinceStart - 7);
    end.setDate(start.getDate() + 6);
  } else {
    // The current rolling window is [today-29, today] — the previous one
    // is the 30 days immediately before it.
    start.setDate(today.getDate() - 59);
    end.setDate(today.getDate() - 30);
  }

  let total = 0;
  let daysCounted = 0;

  for (const cursor = new Date(start); cursor <= end; cursor.setDate(cursor.getDate() + 1)) {
    const value = byDate.get(toLocalDateString(cursor));

    if (value !== undefined) {
      total += value;
      daysCounted += 1;
    }
  }

  return { total, daysCounted };
}
