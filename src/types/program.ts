import type { MealPlan } from "./nutrition";

export type ActivityType = "workout" | "walk";

export type WorkoutType =
  | "push"
  | "pull"
  | "legs"
  | "upper"
  | "lower"
  | "full_body"
  | "cardio"
  | "warmup"
  | "custom";



export interface WorkoutDay {
  id: string;
  workoutId: WorkoutType | null;
  title: string;
  activity: ActivityType;
}

export interface WorkoutCycle {
  days: WorkoutDay[];
}

export interface ProgramSettings {
  autoRepeat: boolean;
}

export interface Program {
  id: string;
  name: string;
  startDate: string;
  active: boolean;

  // How many extra days the workout cycle has been nudged forward without
  // touching startDate itself — see shiftProgramOneDayForward in
  // programEngine.ts. Absent/undefined on programs created before this
  // existed, treated the same as 0.
  cycleShiftDays?: number;

  // The cycle's actual current position: as of `date`, the active day is
  // `dayIndex` (an index into workout.days, before the % length wrap).
  // This is what "today's workout day" is read from now — not pure
  // date arithmetic from startDate — so a workout day can be held in
  // place across a rollover instead of always advancing on its own; see
  // advanceCycleForNewDay in programEngine.ts for the rule. Absent on
  // programs created before this existed; the first read after upgrading
  // bootstraps it from the old date-based formula, so nobody's cycle
  // position jumps the moment this ships.
  cycleAnchor?: {
    date: string;
    dayIndex: number;
  };

  workout: WorkoutCycle;

  nutrition: {
    workout: MealPlan;
    rest: MealPlan;
  };

  settings: ProgramSettings;
}

export interface ProgramsState {
  activeProgramId: string;
  programs: Program[];
}