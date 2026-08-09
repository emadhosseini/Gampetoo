import { calculateBurnedCalories } from "@/domain/services/calorieCalculator";
import { getCurrentProgramDay } from "./programEngine";
import { getLatestWeight } from "./weightEngine";
import { scopedKey } from "./userEngine";
import { getTodayLocalDate } from "./dateFormat";

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

const today = getTodayLocalDate;

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

  // Resolved BEFORE the reset below, deliberately — programEngine's cycle
  // resolution reads this session's still-live completed/lastDate (via a
  // read-only peek at this same storage key) to decide whether a workout
  // day held its place or a rest day advanced. Once the reset below runs,
  // that information is gone, so this has to be the one call that happens
  // first each day.
  const activity = getCurrentProgramDay().activity;

  if (session.lastDate !== today()) {
    session.completed = false;
    session.lastDate = today();
    session.checkedExercises = [];

    saveSession(session);
  }

  return {
    ...session,
    workoutIndex: 0,
    activity,
  };
}

// Toggles one exercise's checked-off-for-today state, keyed by its id
// (unique within the workout it's shown from). Deliberately touches nothing
// but the checklist: the burned-calorie estimate is derived from this list
// on demand (estimateCheckedWorkoutCalories below) and only reaches the
// day's activity total if the user opts in when completing the workout.
export function toggleExerciseChecked(exerciseId: string) {
  const session = parseSession(localStorage.getItem(storageKey())) ?? createSession();

  if (!session.checkedExercises) {
    session.checkedExercises = [];
  }

  const wasChecked = session.checkedExercises.includes(exerciseId);

  session.checkedExercises = wasChecked
    ? session.checkedExercises.filter((id) => id !== exerciseId)
    : [...session.checkedExercises, exerciseId];

  saveSession(session);
}

export interface CalorieEstimateInput {
  id: string;
  metValue: number;
  sets: number;
  // Present for isometric holds, where `reps` is a duration in seconds
  // rather than a count — see Exercise in data/workoutLibrary.
  unit?: "reps" | "seconds";
  reps: number;
}

/**
 * Minutes of activity an exercise represents, which is the one input the MET
 * formula needs from it.
 *
 * A hold states its own duration exactly, so there is nothing to assume: three
 * sets of a 45-second plank is 2.25 minutes, not the 7.5 the per-set stand-in
 * would have claimed. Applied to a plank's MET that was the difference between
 * roughly 13 calories and roughly 56 — the estimate was over four times the
 * real figure for every hold in the program.
 *
 * Repetition work keeps the stand-in, because nothing records how long a set
 * actually took; the number is lifting plus the rest that belongs to it.
 */
function activityMinutes(exercise: CalorieEstimateInput): number {
  return exercise.unit === "seconds"
    ? (exercise.sets * exercise.reps) / 60
    : exercise.sets * ASSUMED_MINUTES_PER_SET;
}

// What the exercises checked off so far are estimated to have burned, via
// the standard MET formula (domain/services/calorieCalculator.ts).
//
// Recomputed from the checklist every time rather than kept as a running
// total, so it can't drift out of step with it — unchecking an exercise, or
// editing its set count in the library mid-workout, is reflected simply by
// the next call returning a different number, with nothing to reverse.
export function estimateCheckedWorkoutCalories(
  exercises: CalorieEstimateInput[],
  checkedExerciseIds: string[],
): number {
  const checked = new Set(checkedExerciseIds);
  const weightKg = getLatestWeight() ?? DEFAULT_WEIGHT_KG;

  return exercises
    .filter((exercise) => checked.has(exercise.id))
    .reduce(
      (sum, exercise) =>
        sum +
        calculateBurnedCalories(
          exercise.metValue,
          weightKg,
          activityMinutes(exercise),
        ),
      0,
    );
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