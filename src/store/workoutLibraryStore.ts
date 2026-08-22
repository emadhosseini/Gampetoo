import { workoutLibrary } from "../data/workoutLibrary";
import { scopedKey } from "../utils/userEngine";

import type {
  Exercise,
  ExerciseGroup,
  WorkoutDefinition,
} from "../data/workoutLibrary";

const STORAGE_KEY = "emad-workout-library-overrides";

function storageKey() {
  return scopedKey(STORAGE_KEY);
}

interface ExerciseOverride {
  sets?: number;
  reps?: number;
  enabled?: boolean;
  repsPerSet?: number[];
}

type OverridesMap = Record<string, ExerciseOverride>;

function overrideKey(
  workoutId: string,
  groupId: string,
  exerciseId: string,
) {
  return `${workoutId}:${groupId}:${exerciseId}`;
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

export function resetLibraryOverrides() {
  localStorage.removeItem(storageKey());
}

function applyOverrides(
  library: WorkoutDefinition[],
  overrides: OverridesMap,
): WorkoutDefinition[] {
  return library.map((workout) => ({
    ...workout,
    groups: workout.groups.map((group) => ({
      ...group,
      exercises: group.exercises.map((exercise) => {
        const override =
          overrides[
            overrideKey(workout.id, group.id, exercise.id)
          ];

        return override
          ? { ...exercise, ...override }
          : exercise;
      }),
    })),
  }));
}

function updateExercise(
  workoutId: string,
  groupId: string,
  exerciseId: string,
  patch: ExerciseOverride,
) {
  const overrides = getOverrides();
  const key = overrideKey(workoutId, groupId, exerciseId);

  overrides[key] = {
    ...overrides[key],
    ...patch,
  };

  saveOverrides(overrides);
}

function findExercise(
  workoutId: string,
  groupId: string,
  exerciseId: string,
): Exercise | undefined {
  const workout = getWorkout(workoutId);

  const group = workout?.groups.find(
    (group) => group.id === groupId,
  );

  return group?.exercises.find(
    (exercise) => exercise.id === exerciseId,
  );
}

const EXTRAS_KEY = "emad-workout-extras";

// "workoutId:groupId" -> exercise ids pulled in from elsewhere in the
// catalogue via the search picker. Stored as ids only, never as copies of
// the exercise: the definition still lives in exactly one place
// (workoutLibrary), so a description or rep-count fixed there is fixed
// everywhere it was added too.
type ExtrasMap = Record<string, string[]>;

function extrasStorageKey() {
  return scopedKey(EXTRAS_KEY);
}

function readExtras(): ExtrasMap {
  const saved = localStorage.getItem(extrasStorageKey());

  if (!saved) return {};

  try {
    return JSON.parse(saved) as ExtrasMap;
  } catch {
    return {};
  }
}

export function addExerciseToGroup(
  workoutId: string,
  groupId: string,
  exerciseId: string,
) {
  const extras = readExtras();
  const key = `${workoutId}:${groupId}`;
  const current = extras[key] ?? [];

  if (current.includes(exerciseId)) return;

  extras[key] = [...current, exerciseId];

  localStorage.setItem(extrasStorageKey(), JSON.stringify(extras));
}

export function removeExerciseFromGroup(
  workoutId: string,
  groupId: string,
  exerciseId: string,
) {
  const extras = readExtras();
  const key = `${workoutId}:${groupId}`;

  if (!extras[key]) return;

  extras[key] = extras[key].filter((id) => id !== exerciseId);

  localStorage.setItem(extrasStorageKey(), JSON.stringify(extras));
}

export function resetWorkoutExtras() {
  localStorage.removeItem(extrasStorageKey());
}

// Resolves each stored id back to its one canonical definition and appends
// it to the group it was added to. Anything that no longer exists in the
// catalogue is skipped rather than crashing — an id can outlive the entry
// it pointed at if the seed data is edited.
function applyExtras(
  library: WorkoutDefinition[],
  extras: ExtrasMap,
): WorkoutDefinition[] {
  if (Object.keys(extras).length === 0) return library;

  const canonical = new Map<string, Exercise>();

  for (const workout of library) {
    for (const group of workout.groups) {
      for (const exercise of group.exercises) {
        if (!canonical.has(exercise.id)) canonical.set(exercise.id, exercise);
      }
    }
  }

  return library.map((workout) => ({
    ...workout,
    groups: workout.groups.map((group) => {
      const added = extras[`${workout.id}:${group.id}`] ?? [];

      if (added.length === 0) return group;

      const present = new Set(group.exercises.map((exercise) => exercise.id));
      const resolved = added
        .filter((id) => !present.has(id))
        .map((id) => canonical.get(id))
        .filter((exercise): exercise is Exercise => exercise !== undefined);

      return { ...group, exercises: [...group.exercises, ...resolved] };
    }),
  }));
}

export function getLibrary(): WorkoutDefinition[] {
  // Extras first, so an added exercise picks up its own saved
  // sets/reps/enabled override in the same pass as everything else.
  return applyOverrides(applyExtras(workoutLibrary, readExtras()), getOverrides());
}

export function getWorkout(
  workoutId: string,
): WorkoutDefinition | undefined {
  return getLibrary().find(
    (workout) => workout.id === workoutId,
  );
}

export function toggleExercise(
  workoutId: string,
  groupId: string,
  exerciseId: string,
) {
  const exercise = findExercise(workoutId, groupId, exerciseId);

  updateExercise(workoutId, groupId, exerciseId, {
    enabled: !(exercise?.enabled ?? true),
  });
}

export function updateSets(
  workoutId: string,
  groupId: string,
  exerciseId: string,
  sets: number,
) {
  updateExercise(workoutId, groupId, exerciseId, {
    sets: Math.max(1, sets),
  });
}

export function updateReps(
  workoutId: string,
  groupId: string,
  exerciseId: string,
  reps: number,
) {
  updateExercise(workoutId, groupId, exerciseId, {
    reps: Math.max(1, reps),
  });
}

export function saveWorkoutExercises(
  workoutId: string,
  groups: ExerciseGroup[],
) {
  const overrides = getOverrides();

  for (const group of groups) {
    for (const exercise of group.exercises) {
      overrides[overrideKey(workoutId, group.id, exercise.id)] = {
        sets: exercise.sets,
        reps: exercise.reps,
        enabled: exercise.enabled,
        repsPerSet: exercise.repsPerSet,
      };
    }
  }

  saveOverrides(overrides);
}

const DEFAULT_PLAN_NAME_KEY = "emad-default-plan-names";
const DEFAULT_PLAN_NAME_FALLBACK = "برنامه پیش‌فرض";

function defaultPlanNameStorageKey() {
  return scopedKey(DEFAULT_PLAN_NAME_KEY);
}

function readDefaultPlanNames(): Record<string, string> {
  const saved = localStorage.getItem(defaultPlanNameStorageKey());

  if (!saved) return {};

  try {
    return JSON.parse(saved) as Record<string, string>;
  } catch {
    return {};
  }
}

// The "برنامه پیش‌فرض" pill's own label, per workout — unlike a real
// workoutVariantStore entry, the base library workout has no `name` field
// of its own to rename, so this is a small separate override keyed by
// workoutId, falling back to the plain "برنامه پیش‌فرض" label until the
// user actually renames it once.
export function getDefaultPlanName(workoutId: string): string {
  return readDefaultPlanNames()[workoutId] ?? DEFAULT_PLAN_NAME_FALLBACK;
}

// Whether the user has actually renamed the default plan away from the
// generic fallback — for a caller that only wants to show a label once
// there's something real to show, "برنامه پیش‌فرض" itself reading as noise
// next to a title that already says what it is (see WorkoutPage.tsx).
export function hasCustomDefaultPlanName(workoutId: string): boolean {
  return readDefaultPlanNames()[workoutId] !== undefined;
}

export function setDefaultPlanName(workoutId: string, name: string) {
  const names = readDefaultPlanNames();

  names[workoutId] = name;

  localStorage.setItem(defaultPlanNameStorageKey(), JSON.stringify(names));
}

export function resetDefaultPlanNames() {
  localStorage.removeItem(defaultPlanNameStorageKey());
}
