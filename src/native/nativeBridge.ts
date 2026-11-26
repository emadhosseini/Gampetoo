import type { Exercise } from "@/data/workoutLibrary";
import { getWorkout } from "@/store/workoutLibraryStore";
import { applyExerciseOrder, getExerciseOrder } from "@/store/workoutOrderStore";
import {
  DEFAULT_VARIANT_ID,
  getVariant,
  getVariants,
  getWorkoutWithVariant,
} from "@/store/workoutVariantStore";
import { getCalorieGoal, getEffectiveProteinTarget } from "@/utils/calorieEngine";
import {
  getCalorieTarget,
  getTodaysTotalCalories,
  getTodaysTotalProtein,
} from "@/utils/dailyLogEngine";
import { getTodayLocalDate } from "@/utils/dateFormat";
import { getTodaysSets } from "@/utils/exerciseSetLogEngine";
import {
  getCurrentProgramDay,
  getCurrentWorkoutType,
  hasStartDate,
  resolvableVariantIds,
} from "@/utils/programEngine";
import { getSession } from "@/utils/sessionEngine";
import { hasCurrentUsername } from "@/utils/userEngine";
import { getTodayGlasses, getWaterGoal } from "@/utils/waterEngine";
import { getLatestWeight } from "@/utils/weightEngine";
import { getCompletionFor } from "@/utils/workoutCompletionLog";

import { GampetooNative, type GampetooWidgetSnapshot } from "./nativePlugin";
import { isNativeIos } from "./platform";
import { getActiveRestTimer } from "./restTimerStore";

export type { GampetooWidgetSnapshot };

export interface ResolvedTodaysWorkout {
  workoutId: string | null;
  variantId: string;
  title: string;
  activity: "workout" | "rest";
  completed: boolean;
  exercises: Exercise[];
  checkedIds: Set<string>;
}

/**
 * Resolves today's active workout definition (respecting the chosen variant
 * and the user's custom exercise order) so Widgets, Dynamic Island, and
 * Apple Watch all mirror WorkoutPage 1:1.
 */
export function resolveTodaysWorkout(): ResolvedTodaysWorkout {
  const hasProgram = hasStartDate();
  const day = hasProgram ? getCurrentProgramDay() : null;
  const session = getSession();
  const workoutType = hasProgram ? getCurrentWorkoutType() : null;
  const todaysRecord = session.completed ? getCompletionFor(getTodayLocalDate()) : null;

  let resolvedVariantId: string | null = null;
  if (day && workoutType) {
    const assignedVariantIds = resolvableVariantIds(
      day.assignedVariantIds,
      (id) => getVariant(id) !== undefined,
    );
    const libraryVariantIds = getVariants(workoutType).map((v) => v.id);
    const choosableVariantIds =
      assignedVariantIds.length > 0
        ? assignedVariantIds
        : libraryVariantIds.length > 0
          ? [DEFAULT_VARIANT_ID, ...libraryVariantIds]
          : [];
    const allPlanIds =
      libraryVariantIds.length > 0 ? [DEFAULT_VARIANT_ID, ...libraryVariantIds] : [];
    const explicitPick =
      session.selectedVariantId !== null && allPlanIds.includes(session.selectedVariantId)
        ? session.selectedVariantId
        : null;
    resolvedVariantId = explicitPick ?? choosableVariantIds[0] ?? null;
  }

  const effectiveWorkoutType = todaysRecord?.workoutId ?? workoutType;
  const effectiveVariantId = todaysRecord
    ? (todaysRecord.variantId ?? null)
    : resolvedVariantId;

  const isWorkoutDay = day?.activity === "workout";
  const workout =
    isWorkoutDay && effectiveWorkoutType
      ? (getWorkoutWithVariant(effectiveWorkoutType, effectiveVariantId) ??
          getWorkout(effectiveWorkoutType))
      : undefined;

  const rawExercises = (workout?.groups ?? [])
    .flatMap((group) => group.exercises ?? [])
    .filter((ex) => ex.enabled === true);

  const orderKey = effectiveWorkoutType
    ? `${effectiveWorkoutType}:${effectiveVariantId ?? DEFAULT_VARIANT_ID}`
    : undefined;

  const exercises = applyExerciseOrder(
    rawExercises,
    orderKey ? getExerciseOrder(orderKey) : undefined,
  );

  return {
    workoutId: effectiveWorkoutType ?? null,
    variantId: effectiveVariantId ?? DEFAULT_VARIANT_ID,
    title: isWorkoutDay
      ? (workout?.title ?? day?.title ?? "برنامه تنظیم نشده")
      : (day?.title ?? "روز استراحت"),
    activity: isWorkoutDay ? "workout" : "rest",
    completed: session.completed === true,
    exercises,
    checkedIds: new Set(session.checkedExercises),
  };
}

export interface LiveActivityUpdateOptions {
  exerciseId?: string;
  exerciseName?: string;
  completedSets?: number;
  totalSets?: number;
  isResting?: boolean;
  notifyRestFinished?: boolean;
  endAtMs?: number;
  totalSeconds?: number;
}

/**
 * Starts or updates the single Gampetoo Live Activity across Dynamic Island,
 * Lock Screen, and Apple Watch Smart Stack.
 */
export async function syncWorkoutLiveActivity(
  options: LiveActivityUpdateOptions = {},
): Promise<boolean> {
  if (!isNativeIos() || !hasCurrentUsername()) return false;

  try {
    const resolved = resolveTodaysWorkout();
    if (resolved.completed) {
      await endRestLiveActivity();
      return false;
    }

    const totalExercises = resolved.exercises.length;
    const completedExercises = resolved.exercises.filter((ex) =>
      resolved.checkedIds.has(ex.id),
    ).length;

    const restTimer = getActiveRestTimer();
    const isResting =
      options.isResting !== undefined
        ? options.isResting && (options.endAtMs ?? 0) > Date.now()
        : restTimer !== null;

    const activeEndAtMs = isResting
      ? (options.endAtMs ?? restTimer?.endAt ?? 0)
      : 0;
    const totalSeconds = isResting
      ? Math.max(1, Math.round(options.totalSeconds ?? restTimer?.totalSeconds ?? 60))
      : 0;

    const targetExercise =
      (options.exerciseId
        ? resolved.exercises.find((ex) => ex.id === options.exerciseId)
        : undefined) ??
      (restTimer?.exerciseId
        ? resolved.exercises.find((ex) => ex.id === restTimer.exerciseId)
        : undefined) ??
      resolved.exercises.find((ex) => !resolved.checkedIds.has(ex.id)) ??
      resolved.exercises[0];

    const exerciseName =
      options.exerciseName ??
      (isResting ? restTimer?.exerciseName : undefined) ??
      targetExercise?.name ??
      resolved.title;

    let completedSets = options.completedSets;
    let totalSets = options.totalSets;
    if ((completedSets === undefined || totalSets === undefined) && targetExercise) {
      const sets = getTodaysSets(targetExercise.id);
      completedSets = sets.filter((s) => s.confirmed).length;
      totalSets = Math.max(sets.length, targetExercise.sets);
    }

    const result = await GampetooNative.startRestTimerActivity({
      workoutTitle: resolved.title,
      exerciseName,
      completedSets: completedSets ?? 0,
      totalSets: totalSets ?? 0,
      completedExercises,
      totalExercises,
      isResting,
      notifyRestFinished: options.notifyRestFinished === true,
      endAtUnixSeconds: isResting ? activeEndAtMs / 1000 : 0,
      totalSeconds,
    });

    return result?.started === true;
  } catch {
    return false;
  }
}

export async function startRestLiveActivity(
  exerciseName: string,
  endAtMs: number,
  totalSeconds: number,
  extra?: { exerciseId?: string; completedSets?: number; totalSets?: number },
): Promise<boolean> {
  return syncWorkoutLiveActivity({
    exerciseId: extra?.exerciseId,
    exerciseName,
    completedSets: extra?.completedSets,
    totalSets: extra?.totalSets,
    isResting: true,
    endAtMs,
    totalSeconds,
  });
}

export async function endRestLiveActivity(): Promise<void> {
  if (!isNativeIos()) return;

  try {
    await GampetooNative.endRestTimerActivity();
  } catch {
    // Non-fatal if Live Activities are unsupported or no activity is active.
  }
}

export async function getNativeCapabilities(): Promise<{
  liveActivitiesEnabled: boolean;
  appGroupAvailable: boolean;
  healthKitAvailable?: boolean;
}> {
  if (!isNativeIos()) {
    return {
      liveActivitiesEnabled: false,
      appGroupAvailable: false,
      healthKitAvailable: false,
    };
  }

  try {
    return await GampetooNative.getCapabilities();
  } catch {
    return {
      liveActivitiesEnabled: false,
      appGroupAvailable: false,
      healthKitAvailable: false,
    };
  }
}

/**
 * Serializes today's key progress metrics into the shared iOS App Group so
 * Home Screen Widgets (and the Apple Watch companion app) stay in sync
 * immediately whenever the user logs food, water, sets, or completes a workout.
 */
export function pushCurrentWidgetSnapshot(): void {
  if (!isNativeIos() || !hasCurrentUsername()) return;

  try {
    const resolved = resolveTodaysWorkout();
    const proteinTarget = getEffectiveProteinTarget(
      getLatestWeight(),
      getCalorieGoal() ?? "maintain",
    );

    const totalExercises = resolved.exercises.length;
    const completedExercises = resolved.exercises.filter((ex) =>
      resolved.checkedIds.has(ex.id),
    ).length;

    const snapshot: GampetooWidgetSnapshot = {
      date: getTodayLocalDate(),
      workoutTitle: resolved.title,
      workoutActivity: resolved.activity,
      workoutCompleted: resolved.completed,
      completedExercises,
      totalExercises,
      caloriesConsumed: Math.round(getTodaysTotalCalories()),
      caloriesTarget: Math.round(getCalorieTarget() ?? 0),
      proteinGrams: Math.round(getTodaysTotalProtein()),
      proteinTarget: Math.round(proteinTarget?.grams ?? 0),
      waterGlasses: getTodayGlasses(),
      waterGoal: getWaterGoal(),
      updatedAt: new Date().toISOString(),
    };

    void GampetooNative.updateWidgetSnapshot(snapshot).catch(() => {});
  } catch {
    // Snapshot sync is best-effort and must never interrupt the UI.
  }
}
