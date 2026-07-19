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

export function getLibrary(): WorkoutDefinition[] {
  return applyOverrides(workoutLibrary, getOverrides());
}

export function getWorkout(
  workoutId: string,
): WorkoutDefinition | undefined {
  return getLibrary().find(
    (workout) => workout.id === workoutId,
  );
}

export function getWorkoutOptions() {
  return workoutLibrary
    .filter((workout) => workout.id !== "warmup")
    .map((workout) => ({
      id: workout.id,
      title: workout.title,
    }));
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
      };
    }
  }

  saveOverrides(overrides);
}
