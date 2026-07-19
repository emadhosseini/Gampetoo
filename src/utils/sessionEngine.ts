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
}

function today() {
  return new Date().toISOString().split("T")[0];
}

function createSession(): SessionState {
  return {
    completed: false,
    lastDate: today(),
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

  if (session.lastDate !== today()) {
    session.completed = false;
    session.lastDate = today();

    saveSession(session);
  }

  return {
    ...session,
    workoutIndex: 0,
    activity: getCurrentProgramDay().activity,
  };
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