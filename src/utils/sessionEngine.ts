import { getCurrentProgramDay } from "./programEngine";
import { scopedKey } from "./userEngine";

const STORAGE_KEY = "emad-session";

function storageKey() {
  return scopedKey(STORAGE_KEY);
}

export type ActivityType = "workout" | "walk";

export interface SessionState {
  completed: boolean;
  lastDate: string;
  // Exercise ids checked off so far in today's workout — resets alongside
  // `completed` on the same day-rollover check, since a stale checklist
  // from a previous day's (possibly different) workout would be meaningless.
  checkedExercises: string[];
}

function today() {
  return new Date().toISOString().split("T")[0];
}

function createSession(): SessionState {
  return {
    completed: false,
    lastDate: today(),
    checkedExercises: [],
  };
}

function parseSession(saved: string | null): SessionState | null {
  if (!saved) return null;

  try {
    return JSON.parse(saved) as SessionState;
  } catch {
    return null;
  }
}

export function getSession() {
  const saved = parseSession(localStorage.getItem(storageKey()));

  if (!saved) {
    const session = createSession();
    saveSession(session);

    return {
      ...session,
      workoutIndex: 0,
      activity: getCurrentProgramDay().activity,
    };
  }

  const session: SessionState = saved;

  // Backfills a session saved before checkedExercises existed.
  if (!session.checkedExercises) {
    session.checkedExercises = [];
  }

  if (session.lastDate !== today()) {
    session.completed = false;
    session.lastDate = today();
    session.checkedExercises = [];

    saveSession(session);
  }

  return {
    ...session,
    workoutIndex: 0,
    activity: getCurrentProgramDay().activity,
  };
}

// Toggles one exercise's checked-off-for-today state, keyed by its
// (globally unique) exercise id from workoutLibrary.ts.
export function toggleExerciseChecked(exerciseId: string) {
  const session = parseSession(localStorage.getItem(storageKey())) ?? createSession();

  if (!session.checkedExercises) {
    session.checkedExercises = [];
  }

  session.checkedExercises = session.checkedExercises.includes(exerciseId)
    ? session.checkedExercises.filter((id) => id !== exerciseId)
    : [...session.checkedExercises, exerciseId];

  saveSession(session);
}

export function saveSession(session: SessionState) {
  localStorage.setItem(storageKey(), JSON.stringify(session));
}

export function completeWorkout() {
  const session = parseSession(localStorage.getItem(storageKey())) ?? createSession();

  session.completed = true;

  saveSession(session);
}

export function completeWalk() {
  const session = parseSession(localStorage.getItem(storageKey())) ?? createSession();

  session.completed = true;

  saveSession(session);
}

export function resetSession() {
  localStorage.removeItem(storageKey());
}