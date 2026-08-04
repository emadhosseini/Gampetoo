import { calculateBurnedCalories } from "@/domain/services/calorieCalculator";
import { getCurrentProgramDay } from "./programEngine";
import { getLatestWeight } from "./weightEngine";
import { logActivityCalories } from "./activityLogEngine";
import { scopedKey } from "./userEngine";

const STORAGE_KEY = "emad-session";

// Stand-ins for the two calculateBurnedCalories inputs nothing else in the
// app tracks yet: a reasonable average adult weight for when the user
// hasn't logged their own (so the estimate still means something instead
// of silently doing nothing), and a rough per-set duration (lifting +
// rest) since no workout timer exists to measure this for real.
const DEFAULT_WEIGHT_KG = 70;
const ASSUMED_MINUTES_PER_SET = 2.5;

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

// Toggles one exercise's checked-off-for-today state, keyed by its id
// (unique within the workout it's shown from). Also logs — or reverses,
// on an uncheck — that exercise's estimated burned calories
// (calculateBurnedCalories, the standard MET formula) against today's
// dailyBurnedCalories (activityLogEngine.ts), so checking exercises off is
// itself what drives that total rather than a separate manual entry.
export function toggleExerciseChecked(
  exerciseId: string,
  metValue: number,
  sets: number,
) {
  const session = parseSession(localStorage.getItem(storageKey())) ?? createSession();

  if (!session.checkedExercises) {
    session.checkedExercises = [];
  }

  const wasChecked = session.checkedExercises.includes(exerciseId);

  session.checkedExercises = wasChecked
    ? session.checkedExercises.filter((id) => id !== exerciseId)
    : [...session.checkedExercises, exerciseId];

  saveSession(session);

  const weightKg = getLatestWeight() ?? DEFAULT_WEIGHT_KG;
  const durationMinutes = sets * ASSUMED_MINUTES_PER_SET;
  const calories = calculateBurnedCalories(metValue, weightKg, durationMinutes);

  logActivityCalories(wasChecked ? -calories : calories);
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