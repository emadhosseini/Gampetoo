import { scopedKey } from "./userEngine";

const SETTINGS_STORAGE_KEY = "emad-free-meal-settings";
const STATE_STORAGE_KEY = "emad-free-meal";
const CYCLE_DURATION_MS = 7 * 24 * 60 * 60 * 1000;
const DEFAULT_WEEKLY_COUNT = 1;

function settingsKey() {
  return scopedKey(SETTINGS_STORAGE_KEY);
}

function stateKey() {
  return scopedKey(STATE_STORAGE_KEY);
}

interface FreeMealSettings {
  weeklyCount: number;
}

// cycleStartedAt anchors the current 7-day window (started the first time a
// free meal was used after the previous cycle expired/reset) — usedCount is
// how many of that window's allowance have been used so far.
interface FreeMealState {
  cycleStartedAt: string;
  usedCount: number;
}

export function getWeeklyFreeMealCount(): number {
  const saved = localStorage.getItem(settingsKey());

  if (!saved) return DEFAULT_WEEKLY_COUNT;

  try {
    const settings = JSON.parse(saved) as FreeMealSettings;
    return settings.weeklyCount > 0 ? settings.weeklyCount : DEFAULT_WEEKLY_COUNT;
  } catch {
    return DEFAULT_WEEKLY_COUNT;
  }
}

export function setWeeklyFreeMealCount(count: number) {
  const settings: FreeMealSettings = { weeklyCount: Math.max(1, Math.round(count)) };
  localStorage.setItem(settingsKey(), JSON.stringify(settings));
}

function readState(): FreeMealState | null {
  const saved = localStorage.getItem(stateKey());

  if (!saved) return null;

  try {
    return JSON.parse(saved) as FreeMealState;
  } catch {
    return null;
  }
}

function isCycleExpired(state: FreeMealState): boolean {
  const startedAt = new Date(state.cycleStartedAt).getTime();
  return Date.now() - startedAt >= CYCLE_DURATION_MS;
}

export interface FreeMealStatus {
  weeklyCount: number;
  usedCount: number;
  remaining: number;
}

/**
 * Current status against the active 7-day cycle. A cycle that's past its
 * 7 days is treated as expired here (lazy reset on read) — the allowance
 * goes back to exactly the configured weekly count, with no carry-over of
 * whatever was left unused in the previous cycle.
 */
export function getFreeMealStatus(): FreeMealStatus {
  const weeklyCount = getWeeklyFreeMealCount();
  const state = readState();

  if (!state || isCycleExpired(state)) {
    return { weeklyCount, usedCount: 0, remaining: weeklyCount };
  }

  return {
    weeklyCount,
    usedCount: state.usedCount,
    remaining: Math.max(weeklyCount - state.usedCount, 0),
  };
}

export function markFreeMealUsed() {
  const weeklyCount = getWeeklyFreeMealCount();
  const existing = readState();
  const cycleActive = existing !== null && !isCycleExpired(existing);

  const state: FreeMealState = {
    cycleStartedAt: cycleActive ? existing.cycleStartedAt : new Date().toISOString(),
    usedCount: Math.min((cycleActive ? existing.usedCount : 0) + 1, weeklyCount),
  };

  localStorage.setItem(stateKey(), JSON.stringify(state));
}

export function resetFreeMeal() {
  localStorage.removeItem(stateKey());
  localStorage.removeItem(settingsKey());
}
