import { scopedKey } from "./userEngine";

const STORAGE_KEY = "emad-weight-log";

export interface WeightEntry {
  id: string;
  date: string; // YYYY-MM-DD
  weight: number; // kg, rounded to 2 decimals
}

function storageKey() {
  return scopedKey(STORAGE_KEY);
}

export function today(): string {
  return new Date().toISOString().split("T")[0];
}

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

  entries.push({ id: date, date, weight: round2(weight) });
  entries.sort((a, b) => a.date.localeCompare(b.date));

  saveWeightLog(entries);

  return entries;
}

export function resetWeightLog() {
  localStorage.removeItem(storageKey());
}
