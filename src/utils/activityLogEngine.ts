import { createDailyMetricLog, type DailyMetricEntry } from "./dailyMetricLog";
import { generateId } from "./id";
import { scopedKey } from "./userEngine";
import { getTodayLocalDate } from "./dateFormat";

const store = createDailyMetricLog("emad-activity-log");

const ENTRIES_STORAGE_KEY = "emad-activity-log-entries";

function entriesKey() {
  return scopedKey(ENTRIES_STORAGE_KEY);
}

const today = getTodayLocalDate;

export type { DailyMetricEntry };

// One logged activity with what it actually was, not just its calorie
// count — ActivityLogModal's note field. Kept as its own small list rather
// than folded into the day's running total (store, above), since that
// total is a single number per date and has no room for text.
export interface ActivityNoteEntry {
  id: string;
  date: string;
  calories: number;
  note: string;
}

function readEntries(): ActivityNoteEntry[] {
  const saved = localStorage.getItem(entriesKey());

  if (!saved) return [];

  try {
    return JSON.parse(saved) as ActivityNoteEntry[];
  } catch {
    return [];
  }
}

function writeEntries(entries: ActivityNoteEntry[]) {
  localStorage.setItem(entriesKey(), JSON.stringify(entries));
}

// Which day's noted activities to show — defaults to today. DailyLogPage's
// activity tab passes its own WeeklyDatePicker selection through instead,
// same date-browsing pattern as the meal tab.
export function getActivityEntries(date: string = today()): ActivityNoteEntry[] {
  return readEntries().filter((entry) => entry.date === date);
}

export function getTodaysActivityEntries(): ActivityNoteEntry[] {
  return getActivityEntries();
}

export function getActivityHistory(): DailyMetricEntry[] {
  return store.getHistory();
}

export function getActivityCalories(date: string = today()): number {
  return date === today() ? store.getToday() : store.getHistory().find((e) => e.date === date)?.value ?? 0;
}

export function getTodayActivityCalories(): number {
  return getActivityCalories();
}

// Adds to whatever that date's running total already is — today() ends up
// exactly where store.addToday() always left it; any other date reads its
// current total first since store has no addToDate of its own.
export function logActivityCalories(
  calories: number,
  date: string = today(),
): DailyMetricEntry[] {
  store.setEntry(date, getActivityCalories(date) + calories);

  return store.getHistory();
}

// Logs one activity: adds its calories to the given day's running total
// exactly like logActivityCalories always did, and — only if a note was
// actually typed — keeps a record of what the activity was, so there's
// something behind the number besides a count. Defaults to today, but
// DailyLogPage's date-picker flow can log against any browsed day too.
export function logActivityEntry(
  calories: number,
  note: string,
  date: string = today(),
): DailyMetricEntry[] {
  const trimmed = note.trim();

  if (trimmed) {
    const entries = readEntries();

    entries.push({ id: generateId(), date, calories, note: trimmed });

    writeEntries(entries);
  }

  return logActivityCalories(calories, date);
}

export function resetActivityLog() {
  store.reset();
  localStorage.removeItem(entriesKey());
}
