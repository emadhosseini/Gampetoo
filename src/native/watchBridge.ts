import { getWorkout } from "@/store/workoutLibraryStore";
import { getAppSettings } from "@/utils/appSettingsEngine";
import { getCalorieGoal, getEffectiveProteinTarget } from "@/utils/calorieEngine";
import {
  getCalorieTarget,
  getTodaysTotalCalories,
  getTodaysTotalProtein,
} from "@/utils/dailyLogEngine";
import { getTodayLocalDate } from "@/utils/dateFormat";
import { addSet, confirmSet, getTodaysSets } from "@/utils/exerciseSetLogEngine";
import {
  getCurrentProgramDay,
  getCurrentWorkoutType,
  hasStartDate,
} from "@/utils/programEngine";
import { completeWalk, completeWorkout, getSession } from "@/utils/sessionEngine";
import { hasCurrentUsername } from "@/utils/userEngine";
import { getTodayGlasses, getWaterGoal, logGlasses } from "@/utils/waterEngine";
import { getLatestWeight } from "@/utils/weightEngine";

import { pushCurrentWidgetSnapshot } from "./nativeBridge";
import {
  GampetooNative,
  type WatchActionPayload,
  type WatchContextPayload,
  type WatchExercisePayload,
  type WatchStatus,
} from "./nativePlugin";
import { isNativeIos } from "./platform";

let watchListenerBound = false;

function buildWatchContext(): WatchContextPayload | null {
  if (!hasCurrentUsername()) return null;

  const hasProgram = hasStartDate();
  const day = hasProgram ? getCurrentProgramDay() : null;
  const session = getSession();
  const workoutType = hasProgram ? getCurrentWorkoutType() : null;
  const workoutDef = workoutType ? getWorkout(workoutType) : undefined;
  const settings = getAppSettings();

  const allExercises = (workoutDef?.groups ?? []).flatMap((group) => group.exercises);

  const exercises: WatchExercisePayload[] = allExercises
    .filter((ex) => ex.enabled === true)
    .slice(0, 14)
    .map((ex) => {
      const todaysSets = getTodaysSets(ex.id);
      const completedSets = todaysSets.filter((s) => s.confirmed).length;
      return {
        id: ex.id,
        name: ex.name,
        sets: ex.sets,
        reps: ex.reps,
        completedSets,
      };
    });

  const proteinTarget = getEffectiveProteinTarget(
    getLatestWeight(),
    getCalorieGoal() ?? "maintain",
  );

  return {
    date: getTodayLocalDate(),
    workoutTitle: day?.title ?? "برنامه تنظیم نشده",
    workoutActivity: day?.activity === "workout" ? "workout" : "rest",
    workoutCompleted: session.completed === true,
    caloriesConsumed: Math.round(getTodaysTotalCalories()),
    caloriesTarget: Math.round(getCalorieTarget() ?? 0),
    proteinGrams: Math.round(getTodaysTotalProtein()),
    proteinTarget: Math.round(proteinTarget?.grams ?? 0),
    waterGlasses: getTodayGlasses(),
    waterGoal: getWaterGoal(),
    restSeconds: settings.restSeconds || 90,
    exercises,
    updatedAt: new Date().toISOString(),
  };
}

export function syncWatchContext(): void {
  if (!isNativeIos()) return;

  try {
    const payload = buildWatchContext();
    if (!payload) return;
    void GampetooNative.syncWatchContext(payload).catch(() => {});
  } catch {
    // Watch sync is best-effort and must never interrupt the UI.
  }
}

function applyWatchAction(action: WatchActionPayload): void {
  if (!hasCurrentUsername()) return;

  switch (action.type) {
    case "logWater": {
      const glasses = Math.max(1, Math.round(action.glasses ?? 1));
      logGlasses(glasses);
      pushCurrentWidgetSnapshot();
      syncWatchContext();
      break;
    }

    case "completeSet": {
      if (!action.exerciseId) break;
      const existing = getTodaysSets(action.exerciseId);
      const nextUnconfirmed = existing.find((s) => !s.confirmed);
      if (nextUnconfirmed) {
        confirmSet(action.exerciseId, nextUnconfirmed.id);
      } else {
        const updated = addSet(action.exerciseId);
        const newest = updated[updated.length - 1];
        if (newest) {
          confirmSet(action.exerciseId, newest.id);
        }
      }
      syncWatchContext();
      break;
    }

    case "completeWorkout": {
      const day = hasStartDate() ? getCurrentProgramDay() : null;
      if (day?.activity === "workout") {
        completeWorkout({ title: day.title });
      } else {
        completeWalk({ title: day?.title ?? "پیاده‌روی" });
      }
      pushCurrentWidgetSnapshot();
      syncWatchContext();
      break;
    }

    case "requestRefresh": {
      syncWatchContext();
      break;
    }
  }
}

export function initWatchBridge(): void {
  if (!isNativeIos()) return;

  if (!watchListenerBound) {
    watchListenerBound = true;
    void GampetooNative.addListener("watchAction", (action) => {
      applyWatchAction(action);
    }).catch(() => {});
  }

  void GampetooNative.drainWatchActions()
    .then(({ actions }) => {
      if (Array.isArray(actions) && actions.length > 0) {
        actions.forEach(applyWatchAction);
      }
    })
    .catch(() => {});

  syncWatchContext();
}

export async function getWatchStatus(): Promise<WatchStatus> {
  if (!isNativeIos()) {
    return {
      supported: false,
      paired: false,
      watchAppInstalled: false,
      reachable: false,
    };
  }

  try {
    return await GampetooNative.getWatchStatus();
  } catch {
    return {
      supported: false,
      paired: false,
      watchAppInstalled: false,
      reachable: false,
    };
  }
}
