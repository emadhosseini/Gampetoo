import { generateId } from "./id";
import { scopedKey } from "./userEngine";

const STORAGE_KEY = "emad-daily-log";

function storageKey() {
  return scopedKey(STORAGE_KEY);
}

function today() {
  return new Date().toISOString().split("T")[0];
}

export interface LoggedFoodEntry {
  id: string;
  name: string;
  amount?: string;
  calories?: number;
}

interface DailyLogState {
  date: string;
  // mealId -> freely-entered food items logged as eaten that meal — not
  // tied to any prescribed nutrition plan, the user can log anything.
  meals: Record<string, LoggedFoodEntry[]>;
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

export function getLoggedEntries(mealId: string): LoggedFoodEntry[] {
  return readState().meals[mealId] ?? [];
}

export function addLoggedEntry(
  mealId: string,
  entry: Omit<LoggedFoodEntry, "id">,
) {
  const state = readState();
  const entries = state.meals[mealId] ?? [];

  state.meals[mealId] = [...entries, { ...entry, id: generateId() }];

  writeState(state);
}

export function removeLoggedEntry(mealId: string, entryId: string) {
  const state = readState();
  const entries = state.meals[mealId] ?? [];

  state.meals[mealId] = entries.filter((entry) => entry.id !== entryId);

  writeState(state);
}

export function resetDailyLog() {
  localStorage.removeItem(storageKey());
}

// Sums every entry under every slot key present today, regardless of which
// calorie-tracking mode (per-meal or daily) logged it — this is what keeps
// the total correct across a mode switch: nothing is migrated when the mode
// changes, so a switch just means today's entries live under a different
// set of keys, and this still adds all of them up.
export function getTodaysTotalCalories(): number {
  return Object.values(readState().meals)
    .flat()
    .reduce((sum, entry) => sum + (entry.calories ?? 0), 0);
}
