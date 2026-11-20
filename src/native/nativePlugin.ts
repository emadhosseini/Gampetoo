import { registerPlugin, type PluginListenerHandle } from "@capacitor/core";

export interface GampetooWidgetSnapshot {
  date: string;
  workoutTitle: string;
  workoutActivity: "workout" | "rest";
  workoutCompleted: boolean;
  caloriesConsumed: number;
  caloriesTarget: number;
  proteinGrams: number;
  waterGlasses: number;
  waterGoal: number;
  updatedAt: string;
}

export interface WatchExercisePayload {
  id: string;
  name: string;
  sets: number;
  reps: number;
  completedSets: number;
}

export interface WatchContextPayload extends GampetooWidgetSnapshot {
  proteinTarget: number;
  restSeconds: number;
  exercises: WatchExercisePayload[];
}

export interface WatchActionPayload {
  type: "logWater" | "completeSet" | "completeWorkout" | "requestRefresh";
  glasses?: number;
  exerciseId?: string;
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
    exerciseName: string;
    endAtUnixSeconds: number;
    totalSeconds: number;
  }): Promise<{ started: boolean }>;
  endRestTimerActivity(): Promise<void>;
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
