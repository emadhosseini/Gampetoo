import { generateId } from "../utils/id";
import { scopedKey } from "../utils/userEngine";
import { getWorkout as getLibraryWorkout } from "./workoutLibraryStore";

import type { ExerciseGroup, WorkoutDefinition } from "../data/workoutLibrary";

const STORAGE_KEY = "emad-workout-variants";

// The sentinel a ProgramDay.assignedVariantIds entry uses for "the plain
// library workout, no separate copy" — every WorkoutType always has this
// one implicitly, so it never needs its own stored record.
export const DEFAULT_VARIANT_ID = "default";

// One named, saved-off copy of a workout's exercise groups — "Push A" next
// to the library's own base "Push" ("Push B" being another one of these).
// Fully independent of workoutLibraryStore's overrides once created: editing
// it never touches the base workout, and vice versa.
export interface WorkoutVariant {
  id: string;
  workoutType: string;
  name: string;
  groups: ExerciseGroup[];
}

function storageKey() {
  return scopedKey(STORAGE_KEY);
}

function readAll(): WorkoutVariant[] {
  const saved = localStorage.getItem(storageKey());

  if (!saved) return [];

  try {
    return JSON.parse(saved) as WorkoutVariant[];
  } catch {
    return [];
  }
}

function writeAll(variants: WorkoutVariant[]) {
  localStorage.setItem(storageKey(), JSON.stringify(variants));
}

export function getVariants(workoutType: string): WorkoutVariant[] {
  return readAll().filter((variant) => variant.workoutType === workoutType);
}

export function getVariant(variantId: string): WorkoutVariant | undefined {
  return readAll().find((variant) => variant.id === variantId);
}

// Clones `groups` into a brand-new named variant — deep-cloned so later
// edits to whatever groups array the caller passed (typically the workout
// editor's own live state) can't reach back and mutate the saved copy.
export function createVariant(
  workoutType: string,
  name: string,
  groups: ExerciseGroup[],
): WorkoutVariant {
  const variant: WorkoutVariant = {
    id: generateId(),
    workoutType,
    name: name.trim() || "بدون نام",
    groups: JSON.parse(JSON.stringify(groups)) as ExerciseGroup[],
  };

  writeAll([...readAll(), variant]);

  return variant;
}

export function updateVariantGroups(variantId: string, groups: ExerciseGroup[]) {
  writeAll(
    readAll().map((variant) =>
      variant.id !== variantId ? variant : { ...variant, groups },
    ),
  );
}

export function renameVariant(variantId: string, name: string) {
  const trimmed = name.trim();

  if (!trimmed) return;

  writeAll(
    readAll().map((variant) =>
      variant.id !== variantId ? variant : { ...variant, name: trimmed },
    ),
  );
}

export function deleteVariant(variantId: string) {
  writeAll(readAll().filter((variant) => variant.id !== variantId));
}

export function resetWorkoutVariants() {
  localStorage.removeItem(storageKey());
}

/**
 * The base library workout (with its groups swapped for a variant's own,
 * when one is picked) — what WorkoutPage actually renders once a day's
 * variant has been resolved for today. `variantId` of undefined/null/
 * DEFAULT_VARIANT_ID, or one that no longer exists (e.g. deleted after
 * being assigned), all fall back to the plain base workout.
 */
export function getWorkoutWithVariant(
  workoutType: string,
  variantId?: string | null,
): WorkoutDefinition | undefined {
  const base = getLibraryWorkout(workoutType);

  if (!base || !variantId || variantId === DEFAULT_VARIANT_ID) {
    return base;
  }

  const variant = getVariant(variantId);

  if (!variant) return base;

  return { ...base, groups: variant.groups };
}
