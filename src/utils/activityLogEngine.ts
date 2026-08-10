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

// One logged activity — its calories and, if typed, what it actually was
// (ActivityLogModal's note field). Kept as its own small list rather than
// folded into the day's running total (store, above), since that total is a
// single number per date with no room for a per-entry breakdown; `note` can
// be empty for an activity logged with no description, same as an entry
// added straight from the quick-add drawer.
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
// exactly like logActivityCalories always did, and keeps a record of it
// (note included when one was actually typed, empty string otherwise) so
// every logged activity — not just the ones with a note — shows up in
// getActivityEntries and can be listed on the daily-log activity tab.
// Defaults to today, but DailyLogPage's date-picker flow can log against
// any browsed day too.
export function logActivityEntry(
  calories: number,
  note: string,
  date: string = today(),
): DailyMetricEntry[] {
  const entries = readEntries();

  entries.push({ id: generateId(), date, calories, note: note.trim() });

  writeEntries(entries);

  return logActivityCalories(calories, date);
}

// Removes one logged activity and backs its calories out of that day's
// running total — the activity-tab equivalent of dailyLogEngine's
// removeLoggedEntry, once entries became listable/expandable there.
export function removeActivityEntry(entryId: string) {
  const entries = readEntries();
  const entry = entries.find((e) => e.id === entryId);

  if (!entry) return;

  writeEntries(entries.filter((e) => e.id !== entryId));
  store.setEntry(entry.date, Math.max(0, getActivityCalories(entry.date) - entry.calories));
}

export function resetActivityLog() {
  store.reset();
  localStorage.removeItem(entriesKey());
}
