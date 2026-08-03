import { createDailyMetricLog, type DailyMetricEntry } from "./dailyMetricLog";

const store = createDailyMetricLog("emad-water-log");

export type { DailyMetricEntry };

export function getWaterHistory(): DailyMetricEntry[] {
  return store.getHistory();
}

export function getTodayGlasses(): number {
  return store.getToday();
}

export function logGlass(): DailyMetricEntry[] {
  return store.addToday(1);
}

export function resetWaterLog() {
  store.reset();
}
