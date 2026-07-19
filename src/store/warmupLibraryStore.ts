import { warmupLibrary } from "../data/warmupLibrary";
import { scopedKey } from "../utils/userEngine";

import type { SpecializedWarmup } from "../data/warmupLibrary";
import type { WorkoutType } from "../types/program";

const STORAGE_KEY = "emad-warmup-library-overrides";

function storageKey() {
  return scopedKey(STORAGE_KEY);
}

type OverridesMap = Record<string, boolean>;

function overrideKey(workoutType: string, groupId: string) {
  return `${workoutType}:${groupId}`;
}

function getOverrides(): OverridesMap {
  const saved = localStorage.getItem(storageKey());

  if (!saved) {
    return {};
  }

  try {
    return JSON.parse(saved) as OverridesMap;
  } catch {
    return {};
  }
}

function saveOverrides(overrides: OverridesMap) {
  localStorage.setItem(storageKey(), JSON.stringify(overrides));
}

export function resetWarmupLibraryOverrides() {
  localStorage.removeItem(storageKey());
}

function applyOverrides(
  library: SpecializedWarmup[],
  overrides: OverridesMap,
): SpecializedWarmup[] {
  return library.map((warmup) => ({
    ...warmup,
    groups: warmup.groups.map((group) => {
      const key = overrideKey(warmup.workoutType, group.id);

      return key in overrides
        ? { ...group, enabled: overrides[key] }
        : group;
    }),
  }));
}

export function getWarmupLibrary(): SpecializedWarmup[] {
  return applyOverrides(warmupLibrary, getOverrides());
}

export function getSpecializedWarmup(
  workoutType: string,
): SpecializedWarmup | undefined {
  return getWarmupLibrary().find(
    (warmup) => warmup.workoutType === workoutType,
  );
}

export function saveWarmupGroups(
  workoutType: WorkoutType,
  groups: { id: string; enabled: boolean }[],
) {
  const overrides = getOverrides();

  for (const group of groups) {
    overrides[overrideKey(workoutType, group.id)] = group.enabled;
  }

  saveOverrides(overrides);
}
