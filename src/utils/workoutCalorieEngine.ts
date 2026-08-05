import { createDailyMetricLog, type DailyMetricEntry } from "./dailyMetricLog";

// Separate from activityLogEngine.ts's "manual activity" log on purpose, so
// the two can be reported as distinct numbers on the daily-log activity tab
// ("کالری سوخته‌شده برنامه تمرینی روزانه" vs manually-logged activity)
// instead of one indistinct blended total.
//
// Written exactly once a day, and only if the user opts in: checking
// exercises off no longer touches this. The estimate accumulates untracked
// while the workout is in progress (derived from the checked exercises — see
// sessionEngine.estimateCheckedWorkoutCalories), gets shown for confirmation
// when the workout is completed, and lands here only if the toggle in
// WorkoutCompleteModal is on. Ticking a checkbox used to write straight
// through to here, which meant the day's activity number moved while the
// user was still mid-workout and an unchecked box had to be reversed out
// again.
const store = createDailyMetricLog("emad-workout-calorie-log");

export type { DailyMetricEntry };

export function getTodayWorkoutCalories(): number {
  return store.getToday();
}

export function getWorkoutCalorieHistory(): DailyMetricEntry[] {
  return store.getHistory();
}

// Sets rather than adds: a day has one workout, so this is a finished
// figure, and completing the same workout twice (slide, cancel, slide
// again) must not double the day's total.
export function setTodayWorkoutCalories(calories: number): DailyMetricEntry[] {
  return store.setToday(calories);
}

export function resetWorkoutCalorieLog() {
  store.reset();
}
