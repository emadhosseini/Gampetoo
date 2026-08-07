import { generateId } from "./id";
import { toFaDigits } from "./numberFormat";
import { scopedKey } from "./userEngine";
import { createDailyMetricLog, type DailyMetricEntry } from "./dailyMetricLog";

const STORAGE_KEY = "emad-daily-log";
const TARGET_KEY = "emad-daily-calorie-target";

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

function sumMacro(
  meals: DailyLogState["meals"],
  pick: (entry: LoggedFoodEntry) => number | undefined,
): number {
  return Object.values(meals)
    .flat()
    .reduce((sum, entry) => sum + (pick(entry) ?? 0), 0);
}

function sumCalories(meals: DailyLogState["meals"]): number {
  return sumMacro(meals, (entry) => entry.calories);
}

export interface EntryMacros {
  calories?: number;
  protein?: number;
  carbs?: number;
  fat?: number;
  fiber?: number;
}

export interface LoggedFoodEntry extends EntryMacros {
  id: string;
  name: string;
  // Display string ("۲ لیوان") — the only amount the UI ever prints.
  amount?: string;
  // Written by both add flows (manual search and AI) so the amount stays
  // editable after the fact. `quantity`/`unitLabel` are the current amount
  // in machine-readable form; `base` is the add-time quantity together with
  // the macros that were computed for exactly that quantity, and it is
  // never rewritten. Every edit rescales from `base`, so editing 2 -> 1 -> 2
  // lands back on the original numbers instead of drifting the way scaling
  // the previous edit's already-rounded result would.
  //
  // All three are optional because an entry logged before this existed
  // simply doesn't have them — isEntryEditable() is how the UI asks.
  quantity?: number;
  unitLabel?: string;
  base?: EntryMacros & { quantity: number };
}

// Whether the amount of an already-logged entry can be changed — false only
// for entries logged before the fields above were recorded, which carry
// their macros as a total with nothing to rescale from.
export function isEntryEditable(entry: LoggedFoodEntry): boolean {
  return (
    entry.quantity !== undefined &&
    entry.base !== undefined &&
    entry.base.quantity > 0
  );
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

function scaled(value: number | undefined, ratio: number) {
  return value === undefined ? undefined : Math.round(value * ratio);
}

// Changes how much of an already-logged food was eaten, rescaling every
// macro (and the printed amount) to match. A no-op for an entry that isn't
// editable — see isEntryEditable.
export function updateLoggedEntryQuantity(
  mealId: string,
  entryId: string,
  quantity: number,
) {
  const state = readState();
  const entries = state.meals[mealId] ?? [];

  state.meals[mealId] = entries.map((entry) => {
    if (entry.id !== entryId || !isEntryEditable(entry)) {
      return entry;
    }

    const base = entry.base!;
    const ratio = quantity / base.quantity;

    return {
      ...entry,
      quantity,
      amount: entry.unitLabel
        ? `${toFaDigits(quantity)} ${entry.unitLabel}`
        : entry.amount,
      calories: scaled(base.calories, ratio),
      protein: scaled(base.protein, ratio),
      carbs: scaled(base.carbs, ratio),
      fat: scaled(base.fat, ratio),
      // Left undefined when the food has no fiber figure at all, which is
      // distinct from a food that genuinely has none — see ServingMacros.
      fiber: scaled(base.fiber, ratio),
    };
  });

  writeState(state);
}

export function removeLoggedEntry(mealId: string, entryId: string) {
  const state = readState();
  const entries = state.meals[mealId] ?? [];

  state.meals[mealId] = entries.filter((entry) => entry.id !== entryId);

  writeState(state);
}

// Clears everything this module owns, not just today's meals: the archived
// per-day calorie history behind the progress chart and the daily target
// live under their own keys, and leaving them behind was why a deleted
// account's calories reappeared the moment it was recreated.
export function resetDailyLog() {
  localStorage.removeItem(storageKey());
  localStorage.removeItem(scopedKey(TARGET_KEY));
  calorieHistory.reset();
}

// Sums every entry under every slot key present today, regardless of which
// calorie-tracking mode (per-meal or daily) logged it under.
export function getTodaysTotalCalories(): number {
  return sumCalories(readState().meals);
}

// Same all-slots, both-modes reach as getTodaysTotalCalories, for the
// progress page's calorie orb — its protein row needs today's actual intake
// regardless of whether the account tracks per-meal or as one daily total.
export function getTodaysTotalProtein(): number {
  return sumMacro(readState().meals, (entry) => entry.protein);
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

export function getCalorieTarget(): number | null {
  const saved = localStorage.getItem(scopedKey(TARGET_KEY));
  const parsed = saved ? Number(saved) : NaN;

  return Number.isFinite(parsed) ? parsed : null;
}

export function setCalorieTarget(calories: number) {
  localStorage.setItem(scopedKey(TARGET_KEY), String(Math.round(calories)));
}
