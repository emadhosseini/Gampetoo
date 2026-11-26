import { generateId } from "./id";

const DUPLICATE_MARKER = "__dup_";

/**
 * Strips any per-day duplicate suffix (`__dup_<token>`) from an exercise id,
 * returning the canonical catalogue id. Ordinary (non-duplicated) ids come
 * back untouched.
 */
export function getBaseExerciseId(exerciseId: string): string {
  const idx = exerciseId.indexOf(DUPLICATE_MARKER);
  return idx === -1 ? exerciseId : exerciseId.slice(0, idx);
}

/**
 * Whether this exercise id represents an extra copy added to the same day
 * alongside another instance of the same movement.
 */
export function isDuplicateExerciseId(exerciseId: string): boolean {
  return exerciseId.includes(DUPLICATE_MARKER);
}

/**
 * Generates a unique id for a duplicate instance of `exerciseId` while
 * preserving its canonical base id so catalogue lookup, muscle taxonomy, and
 * strength stats can still identify the underlying movement.
 */
export function createDuplicateExerciseId(exerciseId: string): string {
  const baseId = getBaseExerciseId(exerciseId);
  const shortToken = generateId().replace(/-/g, "").slice(0, 8);
  return `${baseId}${DUPLICATE_MARKER}${shortToken}`;
}
