import type { WorkoutType } from "./program";

export interface WorkoutExerciseSettings {
  exerciseId: string;

  enabled: boolean;

  sets: number;

  reps: number;
}

export interface WorkoutGroupSettings {
  groupId: string;

  exercises: WorkoutExerciseSettings[];
}

export interface WorkoutSettings {
  workoutType: WorkoutType;

  groups: WorkoutGroupSettings[];
}

export interface WorkoutSettingsState {
  workouts: WorkoutSettings[];
}