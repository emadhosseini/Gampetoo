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
  | "custom";

export interface Exercise {
  id: string;
  name: string;
  sets: number;
  reps: string;
}

export interface Workout {
  id: WorkoutType;
  title: string;
  exercises: Exercise[];
}

export interface WorkoutDay {
  id: string;
  workoutId: WorkoutType | null;
  title: string;
  activity: ActivityType;
}

export interface WorkoutCycle {
  days: WorkoutDay[];
  workouts: Workout[];
}

export interface ProgramSettings {
  autoRepeat: boolean;
}

export interface Program {
  id: string;
  name: string;
  startDate: string;
  active: boolean;

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