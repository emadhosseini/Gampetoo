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