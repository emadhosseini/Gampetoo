import { scopedKey } from "./userEngine";
import { getTodayLocalDate } from "./dateFormat";

const STORAGE_KEY = "emad-body-measurements";

// Height and weight are deliberately not here — height lives in the user
// profile (HeightPicker/HeightModal) and weight has its own engine
// (weightEngine.ts); both are already point-in-time metrics tracked
// elsewhere, so duplicating them here would just create a second source of
// truth for the same number.
export type MeasurementType =
  | "arm"
  | "chest"
  | "upperAbdomen"
  | "hip"
  | "calf"
  | "wrist"
  | "thigh"
  | "waist";

export const MEASUREMENT_TYPES: MeasurementType[] = [
  "arm",
  "chest",
  "upperAbdomen",
  "hip",
  "calf",
  "wrist",
  "thigh",
  "waist",
];

export const MEASUREMENT_LABELS: Record<MeasurementType, string> = {
  arm: "دور بازو",
  chest: "دور سینه",
  upperAbdomen: "دور شکم بین سینه و ناف",
  hip: "دور باسن",
  calf: "دور ساق پا",
  wrist: "دور مچ دست",
  thigh: "دور ران",
  waist: "دور شکم روی ناف",
};

// One color per metric, shared between the per-metric detail chart and the
// combined overview chart's legend — so a metric always reads as the same
// color everywhere it shows up.
export const MEASUREMENT_COLORS: Record<MeasurementType, string> = {
  arm: "#60A5FA",
  chest: "#34D399",
  upperAbdomen: "#FBBF24",
  hip: "#F472B6",
  calf: "#A78BFA",
  wrist: "#22D3EE",
  thigh: "#FB923C",
  waist: "#F87171",
};

// The wheel-picker's own min/max per metric — wide enough to cover any
// realistic body, narrow enough that the wheel isn't mostly dead space.
export const MEASUREMENT_RANGES: Record<MeasurementType, { minCm: number; maxCm: number }> = {
  arm: { minCm: 15, maxCm: 60 },
  chest: { minCm: 50, maxCm: 160 },
  upperAbdomen: { minCm: 50, maxCm: 160 },
  hip: { minCm: 50, maxCm: 170 },
  calf: { minCm: 20, maxCm: 60 },
  wrist: { minCm: 10, maxCm: 30 },
  thigh: { minCm: 25, maxCm: 90 },
  waist: { minCm: 50, maxCm: 170 },
};

export interface MeasurementEntry {
  id: string; // date
  date: string; // YYYY-MM-DD
  values: Partial<Record<MeasurementType, number>>;
  // Same role as weightEngine's WeightEntry.at — when this date's values
  // were last written, for a future multi-device merge to resolve by.
  at?: string;
}

function storageKey() {
  return scopedKey(STORAGE_KEY);
}

const today = getTodayLocalDate;

function round1(value: number): number {
  return Math.round(value * 10) / 10;
}

export function getMeasurementLog(): MeasurementEntry[] {
  const saved = localStorage.getItem(storageKey());

  if (!saved) return [];

  try {
    const parsed = JSON.parse(saved) as MeasurementEntry[];

    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveMeasurementLog(entries: MeasurementEntry[]) {
  localStorage.setItem(storageKey(), JSON.stringify(entries));
}

/**
 * Logs one metric's value for a date, merging into that date's existing
 * entry (if any) rather than replacing it — a day's arm measurement and
 * waist measurement are usually entered separately, so writing one must
 * never wipe out the other's already-logged value for the same day.
 */
export function logMeasurement(
  type: MeasurementType,
  value: number,
  date: string = today(),
): MeasurementEntry[] {
  const entries = getMeasurementLog();
  const idx = entries.findIndex((entry) => entry.date === date);
  const at = new Date().toISOString();

  if (idx >= 0) {
    entries[idx] = {
      ...entries[idx],
      values: { ...entries[idx].values, [type]: round1(value) },
      at,
    };
  } else {
    entries.push({ id: date, date, values: { [type]: round1(value) }, at });
    entries.sort((a, b) => a.date.localeCompare(b.date));
  }

  saveMeasurementLog(entries);

  return entries;
}

/** The most recently logged value for one metric (any date), or null. */
export function getLatestValue(type: MeasurementType): number | null {
  const entries = getMeasurementLog();

  for (let i = entries.length - 1; i >= 0; i--) {
    const value = entries[i].values[type];

    if (value !== undefined) return value;
  }

  return null;
}

/** One metric's history as a plain date/value series, for charting. */
export function getHistoryFor(type: MeasurementType): { date: string; value: number }[] {
  return getMeasurementLog()
    .filter((entry) => entry.values[type] !== undefined)
    .map((entry) => ({ date: entry.date, value: entry.values[type] as number }));
}

export function resetBodyMeasurementsLog() {
  localStorage.removeItem(storageKey());
}
