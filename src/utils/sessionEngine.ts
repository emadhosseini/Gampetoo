import { getCurrentProgramDay } from "./programEngine";

const STORAGE_KEY = "emad-session";

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

export function getSession() {
  const saved = localStorage.getItem(STORAGE_KEY);

  if (!saved) {
    const session = createSession();
    saveSession(session);

    return {
      ...session,
      workoutIndex: 0,
      activity: getCurrentProgramDay().activity,
    };
  }

  const session: SessionState = JSON.parse(saved);

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
  localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
}

export function completeWorkout() {
  const session: SessionState = JSON.parse(
    localStorage.getItem(STORAGE_KEY) ?? JSON.stringify(createSession())
  );

  session.completed = true;

  saveSession(session);
}

export function completeWalk() {
  const session: SessionState = JSON.parse(
    localStorage.getItem(STORAGE_KEY) ?? JSON.stringify(createSession())
  );

  session.completed = true;

  saveSession(session);
}

export function resetSession() {
  localStorage.removeItem(STORAGE_KEY);
}