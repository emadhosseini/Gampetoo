import { scopedKey } from "@/utils/userEngine";

const STORAGE_KEY = "emad-workout-exercise-order";

function storageKey() {
  return scopedKey(STORAGE_KEY);
}

// workoutId -> the user's chosen exercise order for that workout's daily
// list (WorkoutPage), separate from the group structure edited on the
// workout's own settings page.
type OrderMap = Record<string, string[]>;

function readMap(): OrderMap {
  const saved = localStorage.getItem(storageKey());

  if (!saved) return {};

  try {
    return JSON.parse(saved) as OrderMap;
  } catch {
    return {};
  }
}

function writeMap(map: OrderMap) {
  localStorage.setItem(storageKey(), JSON.stringify(map));
}

export function getExerciseOrder(workoutId: string): string[] | undefined {
  return readMap()[workoutId];
}

export function setExerciseOrder(workoutId: string, order: string[]) {
  const map = readMap();

  map[workoutId] = order;

  writeMap(map);
}

export function resetExerciseOrder() {
  localStorage.removeItem(storageKey());
}

// Applies a saved order to a fresh exercise list: ids from the saved order
// come first (in that order), and anything not in it — added to the workout
// since the order was last saved, or if no order was ever saved — is
// appended afterward in its natural (group) order.
export function applyExerciseOrder<T extends { id: string }>(
  exercises: T[],
  order: string[] | undefined,
): T[] {
  if (!order || order.length === 0) return exercises;

  const remaining = new Map(exercises.map((exercise) => [exercise.id, exercise]));
  const ordered: T[] = [];

  for (const id of order) {
    const exercise = remaining.get(id);

    if (exercise) {
      ordered.push(exercise);
      remaining.delete(id);
    }
  }

  ordered.push(...remaining.values());

  return ordered;
}
