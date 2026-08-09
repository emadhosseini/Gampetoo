import { createDailyMetricLog, type DailyMetricEntry } from "./dailyMetricLog";
import { scopedKey } from "./userEngine";
import { getTodayLocalDate } from "./dateFormat";

const store = createDailyMetricLog("emad-water-log");

const GOAL_KEY = "emad-water-goal";

// Eight glasses is the everyday rule-of-thumb people already know, so it's
// what the glass grid starts at until the user picks their own number.
const DEFAULT_GOAL = 8;
export const MIN_WATER_GOAL = 4;
export const MAX_WATER_GOAL = 16;

export type { DailyMetricEntry };

export function getWaterHistory(): DailyMetricEntry[] {
  return store.getHistory();
}

export function getTodayGlasses(): number {
  return store.getToday();
}

export function logGlasses(count: number): DailyMetricEntry[] {
  return store.addToday(Math.max(0, Math.round(count)));
}

/**
 * Sets today's count outright rather than incrementing — the glass grid
 * works by tapping the glass you're up to, so it needs to jump straight to
 * that number (in either direction) instead of adding one at a time.
 */
export function setTodayGlasses(count: number): DailyMetricEntry[] {
  store.setEntry(getTodayLocalDate(), Math.max(0, Math.round(count)));

  return store.getHistory();
}

export function getWaterGoal(): number {
  const saved = Number(localStorage.getItem(scopedKey(GOAL_KEY)));

  if (!Number.isFinite(saved) || saved <= 0) return DEFAULT_GOAL;

  return Math.min(MAX_WATER_GOAL, Math.max(MIN_WATER_GOAL, Math.round(saved)));
}

export function setWaterGoal(goal: number) {
  const clamped = Math.min(MAX_WATER_GOAL, Math.max(MIN_WATER_GOAL, Math.round(goal)));

  localStorage.setItem(scopedKey(GOAL_KEY), String(clamped));
}

export function resetWaterLog() {
  store.reset();
  localStorage.removeItem(scopedKey(GOAL_KEY));
}
