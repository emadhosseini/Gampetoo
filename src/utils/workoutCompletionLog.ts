import { scopedKey } from "./userEngine";
import { getTodayLocalDate } from "./dateFormat";

const STORAGE_KEY = "emad-workout-completion-log";

// Every date the day's workout (or rest-day walk) was actually marked done.
// sessionEngine tracks only TODAY's `completed` flag and clears it on the
// next day-rollover, so before this existed there was no way to ask "was
// the workout done on such-and-such day" for any past date at all — which
// is exactly what the weekly-schedule preview needs to mark a day green or
// red. Written alongside sessionEngine's own completeWorkout/completeWalk
// rather than replacing them: the live "امروز انجام شد" state still comes
// from the session, this is purely the durable record behind it.
function storageKey() {
  return scopedKey(STORAGE_KEY);
}

function readDates(): string[] {
  const saved = localStorage.getItem(storageKey());

  if (!saved) return [];

  try {
    const parsed: unknown = JSON.parse(saved);

    return Array.isArray(parsed) ? (parsed as string[]) : [];
  } catch {
    return [];
  }
}

export function getCompletedDates(): string[] {
  return readDates();
}

export function isCompletedOn(date: string): boolean {
  return readDates().includes(date);
}

export function markCompleted(date: string = getTodayLocalDate()) {
  const dates = readDates();

  if (dates.includes(date)) return;

  localStorage.setItem(storageKey(), JSON.stringify([...dates, date]));
}

export function resetWorkoutCompletionLog() {
  localStorage.removeItem(storageKey());
}
