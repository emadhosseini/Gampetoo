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

export function getTodaysActivityEntries(): ActivityNoteEntry[] {
  return readEntries().filter((entry) => entry.date === today());
}

export function getActivityHistory(): DailyMetricEntry[] {
  return store.getHistory();
}

export function getTodayActivityCalories(): number {
  return store.getToday();
}

export function logActivityCalories(calories: number): DailyMetricEntry[] {
  return store.addToday(calories);
}

// Logs one activity: adds its calories to today's running total exactly
// like logActivityCalories always did, and — only if a note was actually
// typed — keeps a record of what the activity was, so there's something
// behind the number besides a count.
export function logActivityEntry(calories: number, note: string): DailyMetricEntry[] {
  const trimmed = note.trim();

  if (trimmed) {
    const entries = readEntries();

    entries.push({ id: generateId(), date: today(), calories, note: trimmed });

    writeEntries(entries);
  }

  return logActivityCalories(calories);
}

export function resetActivityLog() {
  store.reset();
  localStorage.removeItem(entriesKey());
}
