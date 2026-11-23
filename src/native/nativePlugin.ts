import { registerPlugin, type PluginListenerHandle } from "@capacitor/core";

export interface GampetooWidgetSnapshot {
  date: string;
  workoutTitle: string;
  workoutActivity: "workout" | "rest";
  workoutCompleted: boolean;
  completedExercises?: number;
  totalExercises?: number;
  caloriesConsumed: number;
  caloriesTarget: number;
  proteinGrams: number;
  proteinTarget: number;
  waterGlasses: number;
  waterGoal: number;
  updatedAt: string;
}

export interface WatchSetPayload {
  id: string;
  weight: number;
  reps: number;
  confirmed: boolean;
}

export interface WatchExercisePayload {
  id: string;
  name: string;
  unit: "reps" | "seconds" | "minutes";
  sets: number;
  reps: number;
  completedSets: number;
  checked: boolean;
  entries: WatchSetPayload[];
}

export interface WatchContextPayload extends GampetooWidgetSnapshot {
  restSeconds: number;
  restEndAtUnix?: number;
  restTotalSeconds?: number;
  restExerciseName?: string;
  exercises: WatchExercisePayload[];
}

export interface WatchActionPayload {
  type:
    | "logWater"
    | "completeSet"
    | "updateSet"
    | "addSet"
    | "toggleExercise"
    | "syncRestTimer"
    | "completeWorkout"
    | "requestRefresh";
  glasses?: number;
  exerciseId?: string;
  exerciseName?: string;
  setId?: string;
  setIndex?: number;
  weight?: number;
  reps?: number;
  checked?: boolean;
  restEndAtUnix?: number;
  restTotalSeconds?: number;
  timestamp?: number;
}

export interface WatchStatus {
  supported: boolean;
  paired: boolean;
  watchAppInstalled: boolean;
  reachable: boolean;
}

export interface HealthKitTodaySummary {
  available: boolean;
  steps: number;
  activeCalories: number;
  waterMl: number;
  latestWeightKg?: number;
}

export interface GampetooNativePluginInterface {
  startRestTimerActivity(options: {
    workoutTitle?: string;
    exerciseName: string;
    completedSets?: number;
    totalSets?: number;
    completedExercises?: number;
    totalExercises?: number;
    isResting?: boolean;
    notifyRestFinished?: boolean;
    endAtUnixSeconds: number;
    totalSeconds: number;
  }): Promise<{ started: boolean; reason?: string }>;
  endRestTimerActivity(): Promise<void>;
  scheduleRestNotification(options: {
    endAtUnixSeconds: number;
    exerciseName: string;
  }): Promise<{ scheduled: boolean }>;
  cancelRestNotification(): Promise<void>;
  updateWidgetSnapshot(snapshot: GampetooWidgetSnapshot): Promise<void>;
  getCapabilities(): Promise<{
    liveActivitiesEnabled: boolean;
    appGroupAvailable: boolean;
    healthKitAvailable?: boolean;
  }>;
  requestHealthKitAuth(): Promise<{ granted: boolean; error?: string }>;
  syncHealthKitToday(): Promise<HealthKitTodaySummary>;
  writeHealthKitWater(options: { glasses: number }): Promise<{ saved: boolean }>;
  writeHealthKitWeight(options: { kg: number }): Promise<{ saved: boolean }>;
  writeHealthKitWorkout(options: {
    kind: "workout" | "walk";
    durationMinutes: number;
    calories: number;
    title: string;
  }): Promise<{ saved: boolean }>;
  syncWatchContext(payload: WatchContextPayload): Promise<void>;
  drainWatchActions(): Promise<{ actions: WatchActionPayload[] }>;
  getWatchStatus(): Promise<WatchStatus>;
  addListener(
    eventName: "watchAction",
    listenerFunc: (action: WatchActionPayload) => void,
  ): Promise<PluginListenerHandle>;
}

export const GampetooNative =
  registerPlugin<GampetooNativePluginInterface>("GampetooNative");
