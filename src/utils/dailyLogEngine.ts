import { generateId } from "./id";
import { scopedKey } from "./userEngine";
import { createDailyMetricLog, type DailyMetricEntry } from "./dailyMetricLog";

const STORAGE_KEY = "emad-daily-log";

// Today's meals (below) get discarded the moment the date rolls over — see
// readState(). Before that happens, its final total is archived here, so
// there's still a real history to chart even though the meal-by-meal
// breakdown itself isn't kept past its own day.
const calorieHistory = createDailyMetricLog("emad-daily-log-history");

function storageKey() {
  return scopedKey(STORAGE_KEY);
}

function today() {
  return new Date().toISOString().split("T")[0];
}

function sumCalories(meals: DailyLogState["meals"]): number {
  return Object.values(meals)
    .flat()
    .reduce((sum, entry) => sum + (entry.calories ?? 0), 0);
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

      // A previous day's log, about to be discarded below — archive its
      // final total first, or that day would vanish from the chart
      // entirely instead of just losing its meal-by-meal breakdown.
      if (parsed.date && parsed.meals) {
        calorieHistory.setEntry(parsed.date, sumCalories(parsed.meals));
      }
    } catch {
      // Corrupted storage — fall through and start a fresh, empty log.
    }
  }

  return createState();
}

function writeState(state: DailyLogState) {
  localStorage.setItem(storageKey(), JSON.stringify(state));
  // Keeps today's entry in the history log continuously accurate, rather
  // than only archiving it once the day is already over.
  calorieHistory.setEntry(state.date, sumCalories(state.meals));
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
// calorie-tracking mode (per-meal or daily) logged it under.
export function getTodaysTotalCalories(): number {
  return sumCalories(readState().meals);
}

// The chartable history behind the progress page's daily-calories detail
// page — today's live total plus every previous day's archived total (see
// readState/writeState above).
export function getCalorieHistory(): DailyMetricEntry[] {
  return calorieHistory.getHistory();
}

// Used to decide whether switching calorie-tracking mode needs to warn the
// user first — a mode switch clears today's log (see CalorieModePickerModal),
// since a per-meal breakdown and a single daily total aren't reconcilable
// into one coherent view once both have entries.
export function hasTodaysLoggedEntries(): boolean {
  return Object.values(readState().meals).some((entries) => entries.length > 0);
}
