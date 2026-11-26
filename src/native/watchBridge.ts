import { getExerciseNote } from "@/store/exerciseNoteStore";
import { getAppSettings } from "@/utils/appSettingsEngine";
import { getCalorieGoal, getEffectiveProteinTarget } from "@/utils/calorieEngine";
import {
  getCalorieTarget,
  getTodaysTotalCalories,
  getTodaysTotalProtein,
} from "@/utils/dailyLogEngine";
import { getTodayLocalDate } from "@/utils/dateFormat";
import {
  addSet,
  confirmAllSets,
  confirmSet,
  ensureTodaysSets,
  getPastSessions,
  getTodaysSets,
  updateSet,
} from "@/utils/exerciseSetLogEngine";
import { getCurrentProgramDay, hasStartDate } from "@/utils/programEngine";
import {
  completeWalk,
  completeWorkout,
  getSession,
  toggleExerciseChecked,
} from "@/utils/sessionEngine";
import { hasCurrentUsername } from "@/utils/userEngine";
import { getTodayGlasses, getWaterGoal, logGlasses } from "@/utils/waterEngine";
import { getLatestWeight } from "@/utils/weightEngine";

import {
  endRestLiveActivity,
  pushCurrentWidgetSnapshot,
  resolveTodaysWorkout,
  syncWorkoutLiveActivity,
} from "./nativeBridge";
import {
  GampetooNative,
  type WatchActionPayload,
  type WatchContextPayload,
  type WatchExercisePayload,
  type WatchSetPayload,
  type WatchStatus,
} from "./nativePlugin";
import {
  cancelRestFinishedNotification,
  scheduleRestFinishedNotification,
} from "./notifications";
import { isNativeIos } from "./platform";
import { getActiveRestTimer, setActiveRestTimer } from "./restTimerStore";

export const WATCH_UPDATED_EVENT = "gampetoo:watch-updated";

let watchListenerBound = false;

function notifyWatchUiUpdated(): void {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(WATCH_UPDATED_EVENT));
  }
}

function buildWatchContext(): WatchContextPayload | null {
  if (!hasCurrentUsername()) return null;

  const resolved = resolveTodaysWorkout();
  const settings = getAppSettings();
  const restTimer = getActiveRestTimer();

  const supersetCounts = new Map<string, number>();
  for (const ex of resolved.exercises) {
    if (ex.supersetGroupId) {
      supersetCounts.set(
        ex.supersetGroupId,
        (supersetCounts.get(ex.supersetGroupId) ?? 0) + 1,
      );
    }
  }

  const exercises: WatchExercisePayload[] = resolved.exercises
    .slice(0, 30)
    .map((ex) => {
      const existingSets = getTodaysSets(ex.id);
      let entries: WatchSetPayload[];

      if (existingSets.length > 0) {
        entries = existingSets.map((s) => ({
          id: s.id,
          weight: s.weight,
          reps: s.reps,
          confirmed: s.confirmed,
        }));
      } else {
        const setCount =
          ex.repsPerSet && ex.repsPerSet.length > 0 ? ex.repsPerSet.length : ex.sets;
        const lastWeight =
          getPastSessions(ex.id, 1)[0]
            ?.sets.filter((s) => s.confirmed)
            .slice(-1)[0]?.weight ?? 0;
        entries = Array.from({ length: Math.max(1, setCount) }, (_, idx) => ({
          id: `seed-${idx}`,
          weight: lastWeight,
          reps: ex.repsPerSet?.[idx] ?? ex.reps,
          confirmed: false,
        }));
      }

      const completedSets = entries.filter((s) => s.confirmed).length;
      const note = resolved.workoutId
        ? getExerciseNote(resolved.workoutId, resolved.variantId, ex.id)
        : "";
      const hasSuperset =
        Boolean(ex.supersetGroupId) &&
        (supersetCounts.get(ex.supersetGroupId!) ?? 0) >= 2;

      return {
        id: ex.id,
        name: ex.name,
        ...(note ? { note } : {}),
        ...(hasSuperset ? { supersetBadge: "سوپرست" } : {}),
        unit: ex.unit ?? "reps",
        sets: entries.length,
        reps: ex.reps,
        completedSets,
        checked: resolved.checkedIds.has(ex.id),
        entries,
      };
    });

  const proteinTarget = getEffectiveProteinTarget(
    getLatestWeight(),
    getCalorieGoal() ?? "maintain",
  );

  const totalExercises = resolved.exercises.length;
  const completedExercises = resolved.exercises.filter((ex) =>
    resolved.checkedIds.has(ex.id),
  ).length;

  return {
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
    restSeconds: settings.restSeconds || 90,
    restEndAtUnix: restTimer ? restTimer.endAt / 1000 : 0,
    restTotalSeconds: restTimer ? restTimer.totalSeconds : 0,
    restExerciseName: restTimer ? restTimer.exerciseName : "",
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

function ensureRealSetsForExercise(exerciseId: string) {
  const existing = getTodaysSets(exerciseId);
  if (existing.length > 0) return existing;

  const resolved = resolveTodaysWorkout();
  const def = resolved.exercises.find((ex) => ex.id === exerciseId);
  if (def) {
    return ensureTodaysSets(exerciseId, def.sets, def.reps, def.repsPerSet);
  }
  return addSet(exerciseId);
}

function resolveTargetSet(
  exerciseId: string,
  setId?: string,
  setIndex?: number,
) {
  let sets = ensureRealSetsForExercise(exerciseId);
  let target =
    (setId && !setId.startsWith("seed-")
      ? sets.find((s) => s.id === setId)
      : undefined) ??
    (setIndex !== undefined && setIndex >= 0 && setIndex < sets.length
      ? sets[setIndex]
      : undefined) ??
    sets.find((s) => !s.confirmed);

  if (!target) {
    sets = addSet(exerciseId);
    target = sets[sets.length - 1];
  }
  return target;
}

function applyWatchAction(
  action: WatchActionPayload,
  options?: { deferSync?: boolean },
): boolean {
  if (!hasCurrentUsername()) return false;

  const deferSync = options?.deferSync === true;

  switch (action.type) {
    case "logWater": {
      const glasses = Math.max(1, Math.round(action.glasses ?? 1));
      logGlasses(glasses);
      if (!deferSync) {
        pushCurrentWidgetSnapshot();
        syncWatchContext();
        notifyWatchUiUpdated();
      }
      return true;
    }

    case "updateSet": {
      if (!action.exerciseId) return false;
      const target = resolveTargetSet(
        action.exerciseId,
        action.setId,
        action.setIndex,
      );
      if (!target) return false;

      const patch: { weight?: number; reps?: number } = {};
      if (typeof action.weight === "number" && Number.isFinite(action.weight)) {
        patch.weight = Math.max(0, action.weight);
      }
      if (typeof action.reps === "number" && Number.isFinite(action.reps)) {
        patch.reps = Math.max(0, Math.round(action.reps));
      }
      updateSet(action.exerciseId, target.id, patch);

      if (!deferSync) {
        syncWatchContext();
        notifyWatchUiUpdated();
      }
      return true;
    }

    case "addSet": {
      if (!action.exerciseId) return false;
      ensureRealSetsForExercise(action.exerciseId);
      addSet(action.exerciseId);
      if (!deferSync) {
        syncWatchContext();
        notifyWatchUiUpdated();
      }
      return true;
    }

    case "completeSet": {
      if (!action.exerciseId) return false;
      const target = resolveTargetSet(
        action.exerciseId,
        action.setId,
        action.setIndex,
      );
      if (!target) return false;

      if (
        typeof action.weight === "number" ||
        typeof action.reps === "number"
      ) {
        updateSet(action.exerciseId, target.id, {
          weight:
            typeof action.weight === "number"
              ? Math.max(0, action.weight)
              : target.weight,
          reps:
            typeof action.reps === "number"
              ? Math.max(0, Math.round(action.reps))
              : target.reps,
        });
      }

      const updatedSets = confirmSet(action.exerciseId, target.id);
      const resolved = resolveTodaysWorkout();
      const exDef = resolved.exercises.find((e) => e.id === action.exerciseId);
      const exName = action.exerciseName || exDef?.name || resolved.title;

      // Start/sync rest timer + Dynamic Island on iPhone too!
      const settingsRest = getAppSettings().restSeconds || 90;
      const restTotal = Math.max(
        1,
        Math.round(action.restTotalSeconds ?? settingsRest),
      );
      const restEndMs =
        typeof action.restEndAtUnix === "number" && action.restEndAtUnix > 0
          ? action.restEndAtUnix * 1000
          : Date.now() + restTotal * 1000;

      if (restEndMs > Date.now()) {
        setActiveRestTimer({
          exerciseId: action.exerciseId,
          exerciseName: exName,
          endAt: restEndMs,
          totalSeconds: restTotal,
        });
        void scheduleRestFinishedNotification(restEndMs, exName);
        void syncWorkoutLiveActivity({
          exerciseId: action.exerciseId,
          exerciseName: exName,
          completedSets: updatedSets.filter((s) => s.confirmed).length,
          totalSets: updatedSets.length,
          isResting: true,
          endAtMs: restEndMs,
          totalSeconds: restTotal,
        });
      } else {
        void syncWorkoutLiveActivity({
          exerciseId: action.exerciseId,
          exerciseName: exName,
          completedSets: updatedSets.filter((s) => s.confirmed).length,
          totalSets: updatedSets.length,
          isResting: false,
        });
      }

      if (!deferSync) {
        pushCurrentWidgetSnapshot();
        syncWatchContext();
        notifyWatchUiUpdated();
      }
      return true;
    }

    case "toggleExercise": {
      if (!action.exerciseId) return false;
      const session = getSession();
      const isCurrentlyChecked = session.checkedExercises.includes(
        action.exerciseId,
      );
      const wantChecked =
        typeof action.checked === "boolean"
          ? action.checked
          : !isCurrentlyChecked;

      if (wantChecked !== isCurrentlyChecked) {
        if (wantChecked) {
          confirmAllSets(action.exerciseId);
        }
        toggleExerciseChecked(action.exerciseId);
      }

      void syncWorkoutLiveActivity({ exerciseId: action.exerciseId });

      if (!deferSync) {
        pushCurrentWidgetSnapshot();
        syncWatchContext();
        notifyWatchUiUpdated();
      }
      return true;
    }

    case "syncRestTimer": {
      const endUnix = action.restEndAtUnix ?? 0;
      const endMs = endUnix * 1000;
      if (endMs > Date.now()) {
        const total = Math.max(
          1,
          Math.round(
            action.restTotalSeconds ??
              Math.ceil((endMs - Date.now()) / 1000),
          ),
        );
        const exName = action.exerciseName || "تمرین";
        setActiveRestTimer({
          exerciseName: exName,
          endAt: endMs,
          totalSeconds: total,
        });
        void scheduleRestFinishedNotification(endMs, exName);
        void syncWorkoutLiveActivity({
          exerciseName: exName,
          isResting: true,
          endAtMs: endMs,
          totalSeconds: total,
        });
      } else {
        setActiveRestTimer(null);
        void cancelRestFinishedNotification();
        void syncWorkoutLiveActivity({ isResting: false });
      }

      if (!deferSync) {
        syncWatchContext();
        notifyWatchUiUpdated();
      }
      return true;
    }

    case "completeWorkout": {
      const day = hasStartDate() ? getCurrentProgramDay() : null;
      if (day?.activity === "workout") {
        completeWorkout({ title: day.title });
      } else {
        completeWalk({ title: day?.title ?? "پیاده‌روی" });
      }
      setActiveRestTimer(null);
      void cancelRestFinishedNotification();
      void endRestLiveActivity();
      if (!deferSync) {
        pushCurrentWidgetSnapshot();
        syncWatchContext();
        notifyWatchUiUpdated();
      }
      return true;
    }

    case "requestRefresh": {
      if (!deferSync) {
        syncWatchContext();
      }
      return false;
    }
  }
}

export async function drainPendingWatchActions(): Promise<boolean> {
  if (!isNativeIos()) return false;

  try {
    const { actions } = await GampetooNative.drainWatchActions();
    if (!Array.isArray(actions) || actions.length === 0) return false;

    let mutated = false;
    for (const action of actions) {
      if (applyWatchAction(action, { deferSync: true })) {
        mutated = true;
      }
    }

    if (mutated) {
      pushCurrentWidgetSnapshot();
      syncWatchContext();
      notifyWatchUiUpdated();
    } else {
      syncWatchContext();
    }
    return mutated;
  } catch {
    return false;
  }
}

export function initWatchBridge(): void {
  if (!isNativeIos()) return;

  const bindPromise = !watchListenerBound
    ? (() => {
        watchListenerBound = true;
        return GampetooNative.addListener("watchAction", (action) => {
          applyWatchAction(action);
        }).catch(() => {});
      })()
    : Promise.resolve();

  void bindPromise
    .then(() => drainPendingWatchActions())
    .then((mutated) => {
      if (!mutated) {
        syncWatchContext();
      }
    })
    .catch(() => {
      syncWatchContext();
    });
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
