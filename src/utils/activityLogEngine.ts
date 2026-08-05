import { createDailyMetricLog, type DailyMetricEntry } from "./dailyMetricLog";

const store = createDailyMetricLog("emad-activity-log");

export type { DailyMetricEntry };

export function getActivityHistory(): DailyMetricEntry[] {
  return store.getHistory();
}

export function getTodayActivityCalories(): number {
  return store.getToday();
}

export function logActivityCalories(calories: number): DailyMetricEntry[] {
  return store.addToday(calories);
}

export function resetActivityLog() {
  store.reset();
}
