import type {
  Program,
  ProgramsState,
  Workout,
  WorkoutDay,
} from "../types/program";

import { defaultProgram } from "../data/program/defaultProgram";

const STORAGE_KEY = "emad-programs";

function cloneDefaultProgram(): Program {
  return {
    ...defaultProgram,

    id: crypto.randomUUID(),

    workout: {
      days: defaultProgram.workout.days.map((day) => ({
        ...day,
      })),

      workouts: defaultProgram.workout.workouts.map((workout) => ({
        ...workout,

        exercises: workout.exercises.map((exercise) => ({
          ...exercise,
        })),
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
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export function getPrograms(): ProgramsState {
  const saved = localStorage.getItem(STORAGE_KEY);

  if (!saved) {
    const state = createProgramsState();

    savePrograms(state);

    return state;
  }

  return JSON.parse(saved) as ProgramsState;
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
  localStorage.removeItem(STORAGE_KEY);
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

export function getWorkoutForDate(
  date = new Date()
): Workout | null {
  const program = getActiveProgram();

  const day = getProgramDay(date);

  if (!day.workoutId) {
    return null;
  }

  return (
    program.workout.workouts.find(
      (workout) => workout.id === day.workoutId
    ) ?? null
  );
}

export function getCurrentWorkout(): Workout | null {
  return getWorkoutForDate();
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