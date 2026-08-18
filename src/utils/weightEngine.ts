import { scopedKey } from "./userEngine";
import { getTodayLocalDate } from "./dateFormat";

const STORAGE_KEY = "emad-weight-log";
const TARGET_KEY = "emad-weight-target";

export interface WeightEntry {
  id: string;
  date: string; // YYYY-MM-DD
  weight: number; // kg, rounded to 2 decimals
  // When this date's weight was last written, ISO-8601. Optional because
  // entries written before this existed have none. Lets a sync merge two
  // devices' weight logs by which one actually wrote that date's entry
  // last, instead of replacing the whole log wholesale — see mergeMetricLog.
  at?: string;
}

function storageKey() {
  return scopedKey(STORAGE_KEY);
}

export const today = getTodayLocalDate;

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

export function getWeightLog(): WeightEntry[] {
  const saved = localStorage.getItem(storageKey());

  if (!saved) return [];

  try {
    const parsed = JSON.parse(saved) as WeightEntry[];

    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveWeightLog(entries: WeightEntry[]) {
  localStorage.setItem(storageKey(), JSON.stringify(entries));
}

export function getTodaysWeight(): number | null {
  return getWeightLog().find((entry) => entry.date === today())?.weight ?? null;
}

/** The most recently logged weight overall (any date), not just today's. */
export function getLatestWeight(): number | null {
  const entries = getWeightLog();

  return entries.length > 0 ? entries[entries.length - 1].weight : null;
}

/**
 * Logs a date's weight, replacing any existing entry for that same date
 * rather than creating a duplicate — logging again today just updates it.
 */
export function logWeight(weight: number, date: string = today()): WeightEntry[] {
  const entries = getWeightLog().filter((entry) => entry.date !== date);

  entries.push({ id: date, date, weight: round2(weight), at: new Date().toISOString() });
  entries.sort((a, b) => a.date.localeCompare(b.date));

  saveWeightLog(entries);

  return entries;
}

export function deleteWeightEntry(id: string): WeightEntry[] {
  const entries = getWeightLog().filter((entry) => entry.id !== id);

  saveWeightLog(entries);

  return entries;
}

export function getTargetWeight(): number | null {
  const saved = localStorage.getItem(scopedKey(TARGET_KEY));
  const parsed = saved ? Number(saved) : NaN;

  return Number.isFinite(parsed) ? parsed : null;
}

export function setTargetWeight(weight: number) {
  localStorage.setItem(scopedKey(TARGET_KEY), String(round2(weight)));
}

export function resetWeightLog() {
  localStorage.removeItem(storageKey());
  localStorage.removeItem(scopedKey(TARGET_KEY));
}
