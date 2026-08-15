import type {
  Program,
  ProgramsState,
  WorkoutDay,
  WorkoutType,
} from "../types/program";

import { defaultProgram } from "../data/program/defaultProgram";
import { scopedKey } from "./userEngine";
import { generateId } from "./id";
import { getTodayLocalDate, isoToLocalDate, toLocalDateString } from "./dateFormat";
import { withoutSyncTracking } from "@/sync/remoteSync";

const STORAGE_KEY = "emad-programs";
const SESSION_STORAGE_KEY = "emad-session";

function storageKey() {
  return scopedKey(STORAGE_KEY);
}

function cloneDefaultProgram(): Program {
  return {
    ...defaultProgram,

    id: generateId(),

    workout: {
  days: defaultProgram.workout.days.map((day) => ({
    ...day,
  })),
},

    nutrition: {
      workout: structuredClone(defaultProgram.nutrition.workout),
      rest: structuredClone(defaultProgram.nutrition.rest),
    },

    settings: {
      ...defaultProgram.settings,
    },
  };
}

function createProgramsState(): ProgramsState {
  const program = cloneDefaultProgram();

  return {
    activeProgramId: program.id,
    programs: [program],
  };
}

export function savePrograms(state: ProgramsState) {
  localStorage.setItem(storageKey(), JSON.stringify(state));
}

export function getPrograms(): ProgramsState {
  const saved = localStorage.getItem(storageKey());

  if (saved) {
    try {
      return JSON.parse(saved) as ProgramsState;
    } catch {
      // Corrupted storage — fall through and reseed rather than crash.
    }
  }

  const state = createProgramsState();

  savePrograms(state);

  return state;
}

export function getActiveProgram(): Program {
  const state = getPrograms();

  const active = state.programs.find(
    (program) => program.id === state.activeProgramId
  );

  if (active) {
    return active;
  }

  const fallback = createProgramsState();

  savePrograms(fallback);

  return fallback.programs[0];
}

export function createDefaultProgram(
  startDate = ""
): Program {
  const program = cloneDefaultProgram();

  program.startDate = startDate;

  return program;
}

export function addProgram(program: Program) {
  const state = getPrograms();

  state.programs.push(program);

  savePrograms(state);
}

export function setActiveProgram(programId: string) {
  const state = getPrograms();

  state.activeProgramId = programId;

  state.programs = state.programs.map((program) => ({
    ...program,
    active: program.id === programId,
  }));

  savePrograms(state);
}

export function updateProgram(program: Program) {
  const state = getPrograms();

  state.programs = state.programs.map((item) =>
    item.id === program.id ? program : item
  );

  savePrograms(state);
}

export function deleteProgram(programId: string) {
  const state = getPrograms();

  state.programs = state.programs.filter(
    (program) => program.id !== programId
  );

  if (state.programs.length === 0) {
    const fallback = createProgramsState();

    savePrograms(fallback);

    return;
  }

  if (
    !state.programs.some(
      (program) => program.id === state.activeProgramId
    )
  ) {
    state.activeProgramId = state.programs[0].id;
    state.programs[0].active = true;
  }

  savePrograms(state);
}

// Drops a variant id from every day of every program that had it assigned.
// Deleting a plan used to leave its id behind on the days it was assigned
// to: getVariant() then returned undefined for it, and the day's own
// chooser fell back to labelling it "برنامه پیش‌فرض" — so deleting two
// plans made a day offer three identical-looking "برنامه پیش‌فرض" buttons,
// two of which pointed at plans that no longer existed.
export function unassignVariantEverywhere(variantId: string) {
  const state = getPrograms();
  let touched = false;

  for (const program of state.programs) {
    for (const day of program.workout.days) {
      if (!day.assignedVariantIds?.includes(variantId)) continue;

      day.assignedVariantIds = day.assignedVariantIds.filter((id) => id !== variantId);
      touched = true;
    }
  }

  if (touched) savePrograms(state);
}

// Every assigned id that still resolves to something real — the default
// sentinel, or a variant that actually exists. Defensive rather than
// corrective: it keeps days written before unassignVariantEverywhere
// existed (or by an older build on another device) from showing phantom
// entries, without needing a migration pass over stored programs.
export function resolvableVariantIds(
  assignedVariantIds: string[] | undefined,
  variantExists: (id: string) => boolean,
): string[] {
  return [...new Set(assignedVariantIds ?? [])].filter(
    (id) => id === "default" || variantExists(id),
  );
}

export function resetPrograms() {
  localStorage.removeItem(storageKey());
}

export function hasStartDate(): boolean {
  const program = getActiveProgram();

  return (
    program.startDate.trim().length > 0 &&
    program.workout.days.length > 0
  );
}

export function setProgramStartDate(
  startDate: string
) {
  const program = getActiveProgram();

  updateProgram({
    ...program,
    startDate,
  });
}

// Read-only peek at sessionEngine's own storage — deliberately not an
// import of sessionEngine (which already imports this module for
// getCurrentProgramDay; importing back would be circular). Never writes
// anything. Safe at any point in a render: the only code that ever resets
// completed/lastDate is sessionEngine's own getSession(), and it always
// calls getCurrentProgramDay() — which resolves the cycle below — before
// doing that reset, so this always sees the real, not-yet-reset value for
// whichever day the session was last live for.
function peekSession(): { lastDate: string; completed: boolean } | null {
  try {
    const raw = localStorage.getItem(scopedKey(SESSION_STORAGE_KEY));

    if (!raw) return null;

    const parsed = JSON.parse(raw) as { lastDate?: string; completed?: boolean };

    if (!parsed.lastDate) return null;

    return { lastDate: parsed.lastDate, completed: !!parsed.completed };
  } catch {
    return null;
  }
}

function addLocalDays(iso: string, days: number): string {
  const date = isoToLocalDate(iso);

  date.setDate(date.getDate() + days);

  return toLocalDateString(date);
}

// The cycle's original logic, kept only as the formula a program's very
// first cycleAnchor bootstraps from (see resolveCycleAnchor) — so
// upgrading to the anchor-based system doesn't jump anyone's current day.
function pureDateDayIndex(program: Program, iso: string): number {
  if (!program.startDate) return 0;

  const start = isoToLocalDate(program.startDate);
  const current = isoToLocalDate(iso);

  const diffDays = Math.floor(
    (current.getTime() - start.getTime()) / 86400000
  );

  return Math.max(0, diffDays + (program.cycleShiftDays ?? 0));
}

// The cycle's real current position, resolved (and persisted) lazily —
// at most once per calendar day. A workout day holds its place across a
// day rollover until completeWorkout() was actually called for it; a
// rest/walk day always advances to the next day regardless of whether
// completeWalk() was tapped. Multiple days skipped without the app being
// opened are walked one at a time, defaulting every day past the first to
// "not completed" (there's no session to say otherwise for a day nobody
// saw) — so the walk naturally stops at the first unconfirmed workout day
// in the gap, same as if it had happened one day at a time.
// The cycle anchor is re-derived identically by every device from the same
// program + session, so persisting it is a device talking to itself, not
// the user editing anything. Announcing it as an edit made merely opening
// the app on a second device out-rank real changes made on the first (see
// remoteSync's withoutSyncTracking).
function persistDerived(program: Program) {
  withoutSyncTracking(() => updateProgram(program));
}

function resolveCycleAnchor(program: Program): { date: string; dayIndex: number } {
  const today = getTodayLocalDate();

  if (!program.startDate || program.workout.days.length === 0) {
    return { date: today, dayIndex: 0 };
  }

  const existing = program.cycleAnchor;

  if (!existing) {
    const bootstrapped = { date: today, dayIndex: pureDateDayIndex(program, today) };

    persistDerived({ ...program, cycleAnchor: bootstrapped });

    return bootstrapped;
  }

  if (existing.date === today) {
    return existing;
  }

  const session = peekSession();
  const length = program.workout.days.length;

  let cursorDate = existing.date;
  let cursorIndex = existing.dayIndex;
  let completedAtCursor =
    session && session.lastDate === existing.date ? session.completed : false;

  while (cursorDate < today) {
    const dayType = program.workout.days[((cursorIndex % length) + length) % length].activity;
    const canAdvance = dayType !== "workout" || completedAtCursor;

    if (!canAdvance) break;

    cursorIndex += 1;
    cursorDate = addLocalDays(cursorDate, 1);
    completedAtCursor = false;
  }

  const resolved = { date: today, dayIndex: cursorIndex };

  persistDerived({ ...program, cycleAnchor: resolved });

  return resolved;
}

// Nudges the cycle one day forward regardless of whether the current day
// would otherwise be held in place — the explicit override behind the
// "فراموش کردم" button, for when a workout actually happened but its
// completion never got logged. startDate itself is untouched, which
// should keep showing the program's real, unaltered start date.
export function shiftProgramOneDayForward() {
  const program = getActiveProgram();

  if (!program.startDate) {
    return;
  }

  const anchor = resolveCycleAnchor(program);
  const fresh = getActiveProgram();

  updateProgram({
    ...fresh,
    cycleAnchor: { date: anchor.date, dayIndex: anchor.dayIndex + 1 },
  });
}

export function getProgramDayIndex(
  date = new Date()
): number {
  const program = getActiveProgram();

  if (!program.startDate) {
    return 0;
  }

  const anchor = resolveCycleAnchor(program);
  const targetIso = toLocalDateString(date);

  const diffFromAnchor = Math.floor(
    (isoToLocalDate(targetIso).getTime() - isoToLocalDate(anchor.date).getTime()) / 86400000
  );

  return Math.max(0, anchor.dayIndex + diffFromAnchor);
}

export function getCycleDayIndex(
  date = new Date()
): number {
  const program = getActiveProgram();

  if (program.workout.days.length === 0) {
    return 0;
  }

  return (
    getProgramDayIndex(date) %
    program.workout.days.length
  );
}

export function getProgramDay(
  date = new Date()
): WorkoutDay {
  const program = getActiveProgram();

  if (program.workout.days.length === 0) {
    return {
      id: "",
      workoutId: null,
      title: "",
      activity: "walk",
    };
  }

  return program.workout.days[
    getCycleDayIndex(date)
  ];
}

export function getCurrentProgramDay(): WorkoutDay {
  return getProgramDay();
}

export function getWorkoutTypeForDate(
  date = new Date()
): WorkoutType | null {
  const day = getProgramDay(date);

  return day.workoutId;
}

export function getCurrentWorkoutType(): WorkoutType | null {
  return getWorkoutTypeForDate();
}

export function hasProgramStarted(date = new Date()): boolean {
  const program = getActiveProgram();

  if (!program.startDate) {
    return false;
  }

  const start = new Date(program.startDate);
  start.setHours(0, 0, 0, 0);

  const current = new Date(date);
  current.setHours(0, 0, 0, 0);

  return current.getTime() >= start.getTime();
}

export function getDaysUntilStart(date = new Date()): number {
  const program = getActiveProgram();

  if (!program.startDate) {
    return 0;
  }

  const start = new Date(program.startDate);
  start.setHours(0, 0, 0, 0);

  const current = new Date(date);
  current.setHours(0, 0, 0, 0);

  return Math.max(
    0,
    Math.round((start.getTime() - current.getTime()) / 86400000)
  );
}

export function getMealPlanForDate(
  date = new Date()
) {
  const program = getActiveProgram();

  const day = getProgramDay(date);

  return day.activity === "workout"
    ? program.nutrition.workout
    : program.nutrition.rest;
}

export function getCurrentMealPlan() {
  return getMealPlanForDate();
}
