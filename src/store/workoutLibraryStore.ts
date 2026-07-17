import { workoutLibrary } from "../data/workoutLibrary";

import type {
  WorkoutDefinition,
  Exercise,
} from "../data/workoutLibrary";

const STORAGE_KEY = "emad-workout-library";

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value));
}

let library: WorkoutDefinition[] = loadLibrary();

function loadLibrary(): WorkoutDefinition[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);

    if (!stored) {
      return clone(workoutLibrary);
    }

    return JSON.parse(stored) as WorkoutDefinition[];
  } catch {
    return clone(workoutLibrary);
  }
}

function saveLibrary() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(library));
}

function findExercise(
  workoutId: string,
  groupId: string,
  exerciseId: string,
): Exercise | undefined {
  const workout = library.find((w) => w.id === workoutId);

  if (!workout) return;

  const group = workout.groups.find((g) => g.id === groupId);

  if (!group) return;

  return group.exercises.find((e) => e.id === exerciseId);
}

export function getLibrary(): WorkoutDefinition[] {
  return library;
}

export function getWorkout(
  workoutId: string,
): WorkoutDefinition | undefined {
  return library.find((w) => w.id === workoutId);
}

export function toggleExercise(
  workoutId: string,
  groupId: string,
  exerciseId: string,
) {
  const exercise = findExercise(
    workoutId,
    groupId,
    exerciseId,
  );

  if (!exercise) return;

  exercise.enabled = !exercise.enabled;

  saveLibrary();
}

export function updateSets(
  workoutId: string,
  groupId: string,
  exerciseId: string,
  sets: number,
) {
  const exercise = findExercise(
    workoutId,
    groupId,
    exerciseId,
  );

  if (!exercise) return;

  exercise.sets = sets;

  saveLibrary();
}

export function updateReps(
  workoutId: string,
  groupId: string,
  exerciseId: string,
  reps: number,
) {
  const exercise = findExercise(
    workoutId,
    groupId,
    exerciseId,
  );

  if (!exercise) return;

  exercise.reps = reps;

  saveLibrary();
}

export function reloadLibrary() {
  library = loadLibrary();
}

export function resetLibrary() {
  library = clone(workoutLibrary);

  saveLibrary();
}