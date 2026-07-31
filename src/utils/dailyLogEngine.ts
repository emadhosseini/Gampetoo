import { scopedKey } from "./userEngine";

const STORAGE_KEY = "emad-daily-log";

function storageKey() {
  return scopedKey(STORAGE_KEY);
}

function today() {
  return new Date().toISOString().split("T")[0];
}

interface DailyLogState {
  date: string;
  // mealId -> ids of the foods (from that meal's food list) logged as eaten.
  meals: Record<string, string[]>;
}

function createState(): DailyLogState {
  return { date: today(), meals: {} };
}

function readState(): DailyLogState {
  const saved = localStorage.getItem(storageKey());

  if (saved) {
    try {
      const parsed = JSON.parse(saved) as DailyLogState;

      if (parsed.date === today() && parsed.meals) {
        return parsed;
      }
    } catch {
      // Corrupted storage — fall through and start a fresh, empty log.
    }
  }

  return createState();
}

function writeState(state: DailyLogState) {
  localStorage.setItem(storageKey(), JSON.stringify(state));
}

export function getLoggedFoodIds(mealId: string): string[] {
  return readState().meals[mealId] ?? [];
}

export function setLoggedFoodIds(mealId: string, foodIds: string[]) {
  const state = readState();

  state.meals[mealId] = foodIds;

  writeState(state);
}

export function resetDailyLog() {
  localStorage.removeItem(storageKey());
}
