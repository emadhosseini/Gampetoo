import { createDailyMetricLog, type DailyMetricEntry } from "./dailyMetricLog";

// Separate from activityLogEngine.ts's "manual activity" log on purpose —
// this one is fed exclusively by checking exercises off in today's workout
// (sessionEngine.ts's toggleExerciseChecked, via the MET calorie formula —
// see domain/services/calorieCalculator.ts), so the two can be reported as
// distinct numbers on the daily-log activity tab ("کالری سوخته‌شده برنامه
// تمرینی روزانه" vs manually-logged activity) instead of one indistinct
// blended total.
const store = createDailyMetricLog("emad-workout-calorie-log");

export type { DailyMetricEntry };

export function getTodayWorkoutCalories(): number {
  return store.getToday();
}

export function getWorkoutCalorieHistory(): DailyMetricEntry[] {
  return store.getHistory();
}

export function logWorkoutCalories(calories: number): DailyMetricEntry[] {
  return store.addToday(calories);
}

export function resetWorkoutCalorieLog() {
  store.reset();
}
