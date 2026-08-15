import { scopedKey } from "./userEngine";
import { getTodayLocalDate } from "./dateFormat";

const STORAGE_KEY = "emad-workout-completion-log";

/**
 * What was actually done on a given day.
 *
 * Recording this — rather than re-deriving it from the program every time
 * — is the whole point. The program is a mutable repeating cycle, so
 * assigning a new plan to "day 3" silently rewrote what today had been,
 * even for a day already finished: a workout done as پشت started
 * displaying as پا, with a 0-exercise summary because the checked-off
 * exercises belonged to the other plan. A finished day is history, and
 * history must not move when next week's plan changes.
 *
 * Every field past `date` is optional: entries written before this existed
 * carry only the date, which is exactly what they always meant, and a
 * rest-day walk has no workout to name.
 */
export interface WorkoutCompletionEntry {
  date: string;
  /** WorkoutType the day resolved to — e.g. "full_body". */
  workoutId?: string | null;
  /** workoutVariantStore id, or "default"/null for the base workout. */
  variantId?: string | null;
  /** Titles as they read on the day, so a later rename can't rewrite them. */
  title?: string;
  variantName?: string;
}

function storageKey() {
  return scopedKey(STORAGE_KEY);
}

/**
 * Reads both shapes. This used to be a plain array of date strings, and
 * those entries stay valid — they just carry nothing but the date.
 */
function readEntries(): WorkoutCompletionEntry[] {
  const saved = localStorage.getItem(storageKey());

  if (!saved) return [];

  try {
    const parsed: unknown = JSON.parse(saved);

    if (!Array.isArray(parsed)) return [];

    return parsed
      .map((item) =>
        typeof item === "string" ? { date: item } : (item as WorkoutCompletionEntry),
      )
      .filter((entry) => typeof entry?.date === "string");
  } catch {
    return [];
  }
}

function writeEntries(entries: WorkoutCompletionEntry[]) {
  localStorage.setItem(storageKey(), JSON.stringify(entries));
}

export function getCompletionEntries(): WorkoutCompletionEntry[] {
  return readEntries();
}

export function getCompletedDates(): string[] {
  return readEntries().map((entry) => entry.date);
}

export function isCompletedOn(date: string): boolean {
  return readEntries().some((entry) => entry.date === date);
}

/** What was done on that date, or null if it wasn't completed. */
export function getCompletionFor(date: string): WorkoutCompletionEntry | null {
  return readEntries().find((entry) => entry.date === date) ?? null;
}

/**
 * Records a finished day. Re-completing the same date merges into the
 * existing entry rather than adding a second one — the day only happened
 * once, and this is what upgrades an older date-only entry in place.
 */
export function markCompleted(
  details: Omit<WorkoutCompletionEntry, "date"> = {},
  date: string = getTodayLocalDate(),
) {
  const entries = readEntries();
  const index = entries.findIndex((entry) => entry.date === date);

  if (index >= 0) {
    entries[index] = { ...entries[index], ...details, date };
  } else {
    entries.push({ date, ...details });
  }

  writeEntries(entries);
}

// The "فراموش کردم دیروز رو ثبت کنم" flow rewinds today back to not-done —
// since `completed` is read from this log, un-marking here is what actually
// makes that rewind stick.
export function unmarkCompleted(date: string = getTodayLocalDate()) {
  const entries = readEntries();
  const remaining = entries.filter((entry) => entry.date !== date);

  if (remaining.length === entries.length) return;

  writeEntries(remaining);
}

export function resetWorkoutCompletionLog() {
  localStorage.removeItem(storageKey());
}
