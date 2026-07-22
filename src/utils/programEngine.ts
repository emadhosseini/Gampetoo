import type {
  Program,
  ProgramsState,
  WorkoutDay,
  WorkoutType,
} from "../types/program";

import { defaultProgram } from "../data/program/defaultProgram";
import { scopedKey } from "./userEngine";
import { generateId } from "./id";

const STORAGE_KEY = "emad-programs";

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

// Moves the cycle's startDate one day earlier, which shifts every future
// day-index computation (getProgramDayIndex et al.) forward by one day —
// for when a workout actually happened but its completion never got
// logged, so the cycle would otherwise repeat that day. Parses/formats the
// date locally (not via Date's UTC-based ISO parsing) to avoid an
// off-by-one across timezones, matching isoToLocalDate/dateToISO elsewhere.
export function shiftProgramOneDayForward() {
  const program = getActiveProgram();

  if (!program.startDate) {
    return;
  }

  const [y, m, d] = program.startDate.split("-").map(Number);
  const start = new Date(y, m - 1, d);

  start.setDate(start.getDate() - 1);

  const newStartDate = [
    start.getFullYear(),
    String(start.getMonth() + 1).padStart(2, "0"),
    String(start.getDate()).padStart(2, "0"),
  ].join("-");

  updateProgram({
    ...program,
    startDate: newStartDate,
  });
}

export function getProgramDayIndex(
  date = new Date()
): number {
  const program = getActiveProgram();

  if (!program.startDate) {
    return 0;
  }

  const start = new Date(program.startDate);
  start.setHours(0, 0, 0, 0);

  const current = new Date(date);
  current.setHours(0, 0, 0, 0);

  const diffDays = Math.floor(
    (current.getTime() - start.getTime()) / 86400000
  );

  return Math.max(0, diffDays);
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