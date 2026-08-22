import { scopedKey } from "../utils/userEngine";

const STORAGE_KEY = "emad-exercise-notes";

// A coach's note ("این حرکت رو با دست بسته انجام بده") almost always means
// something about one specific plan, not the exercise itself everywhere it
// shows up — پوش A and پوش B share the same "پرس سینه هالتر", but a note
// written for one has no business appearing on the other. So a note is
// keyed by (workoutId, variantId, exerciseId), never by exerciseId alone —
// variantId is DEFAULT_VARIANT_ID for the base "برنامه پیش‌فرض", exactly
// the same identity WorkoutPage/workoutVariantStore already use everywhere
// else a plan needs picking out.
type NotesMap = Record<string, string>;

function storageKey() {
  return scopedKey(STORAGE_KEY);
}

function noteKey(workoutId: string, variantId: string, exerciseId: string) {
  return `${workoutId}:${variantId}:${exerciseId}`;
}

function readNotes(): NotesMap {
  const saved = localStorage.getItem(storageKey());

  if (!saved) return {};

  try {
    return JSON.parse(saved) as NotesMap;
  } catch {
    return {};
  }
}

function writeNotes(notes: NotesMap) {
  localStorage.setItem(storageKey(), JSON.stringify(notes));
}

export function getExerciseNote(
  workoutId: string,
  variantId: string,
  exerciseId: string,
): string {
  return readNotes()[noteKey(workoutId, variantId, exerciseId)] ?? "";
}

export function setExerciseNote(
  workoutId: string,
  variantId: string,
  exerciseId: string,
  note: string,
) {
  const notes = readNotes();
  const key = noteKey(workoutId, variantId, exerciseId);
  const trimmed = note.trim();

  if (trimmed) {
    notes[key] = trimmed;
  } else {
    delete notes[key];
  }

  writeNotes(notes);
}

// A brand-new plan is edited under a temporary client-side id
// (WorkoutDetailPage's pendingVariants) until "ذخیره" actually creates it
// and hands back its real one — any note jotted down before that point was
// saved under the temp id, so it has to move to the real id in the same
// step, or it would silently vanish the moment the temp id stops being
// reachable from anywhere.
export function movePlanNotes(workoutId: string, fromVariantId: string, toVariantId: string) {
  if (fromVariantId === toVariantId) return;

  const notes = readNotes();
  const prefix = `${workoutId}:${fromVariantId}:`;
  let changed = false;

  for (const key of Object.keys(notes)) {
    if (!key.startsWith(prefix)) continue;

    const exerciseId = key.slice(prefix.length);

    notes[`${workoutId}:${toVariantId}:${exerciseId}`] = notes[key];
    delete notes[key];
    changed = true;
  }

  if (changed) writeNotes(notes);
}

export function resetExerciseNotes() {
  localStorage.removeItem(storageKey());
}
