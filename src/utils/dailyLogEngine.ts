import { generateId } from "./id";
import { toFaDigits } from "./numberFormat";
import { scopedKey } from "./userEngine";
import { createDailyMetricLog, type DailyMetricEntry } from "./dailyMetricLog";
import { getTodayLocalDate } from "./dateFormat";

const STORAGE_KEY = "emad-daily-log";
const TARGET_KEY = "emad-daily-calorie-target";
// Ids of food entries the user actually deleted. Needed because the daily
// log is merged across devices by unioning entries (see
// sync/mergeStrategies): without a record of a deletion, the other device
// still holding the entry would hand it straight back on the next pull.
const DELETED_KEY = "emad-daily-log-deleted";

// Every day's calorie total, kept indefinitely (see LogsByDate below) so a
// chart always has a real series to draw from rather than only today's
// live number plus whatever calorieHistory happened to archive on the way
// out. Still its own separate log rather than derived on the fly from
// LogsByDate on every chart read — same reasoning as before this became
// multi-day: it's a plain number series, cheap to read, and untouched by a
// factory reset's meal-by-meal wipe timing.
const calorieHistory = createDailyMetricLog("emad-daily-log-history");

function storageKey() {
  return scopedKey(STORAGE_KEY);
}

const today = getTodayLocalDate;

function sumMacro(
  meals: DayLog["meals"],
  pick: (entry: LoggedFoodEntry) => number | undefined,
): number {
  return Object.values(meals)
    .flat()
    .reduce((sum, entry) => sum + (pick(entry) ?? 0), 0);
}

function sumCalories(meals: DayLog["meals"]): number {
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

interface DayLog {
  // mealId -> freely-entered food items logged as eaten that meal — not
  // tied to any prescribed nutrition plan, the user can log anything.
  meals: Record<string, LoggedFoodEntry[]>;
}

// date (YYYY-MM-DD, local) -> that day's full meal breakdown. Every day
// ever logged stays here — this used to hold only "today"'s state and
// discard the rest at midnight rollover (calorieHistory above was the only
// thing that survived), which is exactly what made a horizontal date picker
// impossible: there was nothing to look back at. A date with nothing logged
// simply has no key here at all.
type LogsByDate = Record<string, DayLog>;

interface LegacyDailyLogState {
  date: string;
  meals: DayLog["meals"];
}

function isLegacyShape(value: unknown): value is LegacyDailyLogState {
  return (
    !!value &&
    typeof value === "object" &&
    "date" in value &&
    "meals" in value &&
    typeof (value as LegacyDailyLogState).date === "string"
  );
}

function readLogs(): LogsByDate {
  const saved = localStorage.getItem(storageKey());

  if (!saved) return {};

  try {
    const parsed: unknown = JSON.parse(saved);

    // One-time migration from the old today-only shape ({date, meals}) to
    // the per-date record below — an account that already has a saved log
    // from before this change gets that single day preserved under its own
    // date instead of losing it.
    if (isLegacyShape(parsed)) {
      return { [parsed.date]: { meals: parsed.meals } };
    }

    return (parsed as LogsByDate) ?? {};
  } catch {
    return {};
  }
}

function writeLogs(logs: LogsByDate) {
  localStorage.setItem(storageKey(), JSON.stringify(logs));
}

function getDay(logs: LogsByDate, date: string): DayLog {
  return logs[date] ?? { meals: {} };
}

// Writes one day's log back into the full record and keeps calorieHistory
// (the chart's data source) in sync with it — for any date, not just
// today's, so logging or editing a past day updates its chart bar too.
function writeDay(logs: LogsByDate, date: string, day: DayLog) {
  logs[date] = day;
  writeLogs(logs);
  calorieHistory.setEntry(date, sumCalories(day.meals));
}

export function getLoggedEntries(
  mealId: string,
  date: string = today(),
): LoggedFoodEntry[] {
  return getDay(readLogs(), date).meals[mealId] ?? [];
}

export function addLoggedEntry(
  mealId: string,
  entry: Omit<LoggedFoodEntry, "id">,
  date: string = today(),
) {
  const logs = readLogs();
  const day = getDay(logs, date);
  const entries = day.meals[mealId] ?? [];

  day.meals[mealId] = [...entries, { ...entry, id: generateId() }];

  writeDay(logs, date, day);
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
  date: string = today(),
) {
  const logs = readLogs();
  const day = getDay(logs, date);
  const entries = day.meals[mealId] ?? [];

  day.meals[mealId] = entries.map((entry) => {
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

  writeDay(logs, date, day);
}

function deletedStorageKey() {
  return scopedKey(DELETED_KEY);
}

export function getDeletedEntryIds(): string[] {
  const saved = localStorage.getItem(deletedStorageKey());

  if (!saved) return [];

  try {
    const parsed: unknown = JSON.parse(saved);

    return Array.isArray(parsed) ? (parsed as string[]) : [];
  } catch {
    return [];
  }
}

function rememberDeletion(entryId: string) {
  const ids = getDeletedEntryIds();

  if (ids.includes(entryId)) return;

  localStorage.setItem(deletedStorageKey(), JSON.stringify([...ids, entryId]));
}

export function resetDeletedEntryIds() {
  localStorage.removeItem(deletedStorageKey());
}

export function removeLoggedEntry(
  mealId: string,
  entryId: string,
  date: string = today(),
) {
  const logs = readLogs();
  const day = getDay(logs, date);
  const entries = day.meals[mealId] ?? [];

  day.meals[mealId] = entries.filter((entry) => entry.id !== entryId);

  rememberDeletion(entryId);

  writeDay(logs, date, day);
}

// Clears everything this module owns, not just today's meals: every day
// ever logged, the archived per-day calorie history behind the progress
// chart, and the daily target all live under keys this owns — leaving any
// of them behind was why a deleted account's calories reappeared the moment
// it was recreated. Used by the factory-reset flow (resetApplication.ts).
export function resetDailyLog() {
  localStorage.removeItem(storageKey());
  localStorage.removeItem(scopedKey(TARGET_KEY));
  calorieHistory.reset();
}

// Clears only today's meals, leaving every other day (and the calorie
// target) untouched — what CalorieModePickerModal actually needs when
// switching tracking mode, since a per-meal breakdown and a single daily
// total aren't reconcilable once both have entries for the same day. A full
// resetDailyLog() here would have wiped every previously-logged day too,
// which the "پاک می‌شن" warning it shows never promised.
export function resetTodaysLog() {
  const logs = readLogs();
  writeDay(logs, today(), { meals: {} });
}

// Sums every entry under every slot key present on the given date,
// regardless of which calorie-tracking mode (per-meal or daily) logged it
// under. Defaults to today for every existing caller (the progress page's
// calorie orb, the daily-calories chart target/history) that has always
// meant "today" and has no date picker of its own.
export function getTotalCalories(date: string = today()): number {
  return sumCalories(getDay(readLogs(), date).meals);
}

export function getTotalProtein(date: string = today()): number {
  return sumMacro(getDay(readLogs(), date).meals, (entry) => entry.protein);
}

// Kept as thin today-only aliases — every call site outside DailyLogPage's
// own date-picker flow means literally "today" and reads better that way
// than spelling out getTotalCalories() with no argument.
export function getTodaysTotalCalories(): number {
  return getTotalCalories();
}

export function getTodaysTotalProtein(): number {
  return getTotalProtein();
}

// The chartable history behind the progress page's daily-calories detail
// page.
//
// Derived from the meal log on every read, with the archived series used
// only for dates the log itself no longer covers (days that predate the
// per-date LogsByDate shape). The archive alone was the source of truth
// here, and it drifted: it's written only by writeDay, so anything that
// changes the log without going through this module leaves it stale —
// which is exactly what a sync does. The log and its archive are merged by
// separate rules (union of entries vs. most-recent-writer per date, see
// sync/mergeStrategies), so a pull that unions in another device's meals
// leaves the archive holding whichever single number won the recency test.
// That's how a day showing 1525 calories on the dashboard could draw a
// 147-calorie bar on the chart.
//
// Recomputing instead of repairing makes the two views incapable of
// disagreeing, and needs no migration to fix an account already in that
// state.
export function getCalorieHistory(): DailyMetricEntry[] {
  const totals = new Map(
    calorieHistory.getHistory().map((entry) => [entry.date, entry.value]),
  );

  for (const [date, day] of Object.entries(readLogs())) {
    totals.set(date, sumCalories(day.meals));
  }

  return Array.from(totals, ([date, value]) => ({ date, value })).sort(
    (a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0),
  );
}

// Used to decide whether switching calorie-tracking mode needs to warn the
// user first — a mode switch clears today's log (see
// CalorieModePickerModal/resetTodaysLog), since a per-meal breakdown and a
// single daily total aren't reconcilable into one coherent view once both
// have entries.
export function hasLoggedEntries(date: string = today()): boolean {
  return Object.values(getDay(readLogs(), date).meals).some(
    (entries) => entries.length > 0,
  );
}

export function hasTodaysLoggedEntries(): boolean {
  return hasLoggedEntries();
}

export function getCalorieTarget(): number | null {
  const saved = localStorage.getItem(scopedKey(TARGET_KEY));
  const parsed = saved ? Number(saved) : NaN;

  return Number.isFinite(parsed) ? parsed : null;
}

export function setCalorieTarget(calories: number) {
  localStorage.setItem(scopedKey(TARGET_KEY), String(Math.round(calories)));
}
