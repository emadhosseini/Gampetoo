import { getCalorieTarget, getTodaysTotalCalories, getTodaysTotalProtein } from "@/utils/dailyLogEngine";
import { getTodayLocalDate } from "@/utils/dateFormat";
import { getCurrentProgramDay, hasStartDate } from "@/utils/programEngine";
import { getSession } from "@/utils/sessionEngine";
import { hasCurrentUsername } from "@/utils/userEngine";
import { getTodayGlasses, getWaterGoal } from "@/utils/waterEngine";

import { GampetooNative, type GampetooWidgetSnapshot } from "./nativePlugin";
import { isNativeIos } from "./platform";

export type { GampetooWidgetSnapshot };

export async function startRestLiveActivity(
  exerciseName: string,
  endAtMs: number,
  totalSeconds: number,
): Promise<boolean> {
  if (!isNativeIos()) return false;

  try {
    const result = await GampetooNative.startRestTimerActivity({
      exerciseName,
      endAtUnixSeconds: Math.floor(endAtMs / 1000),
      totalSeconds: Math.max(1, Math.round(totalSeconds)),
    });
    return result?.started === true;
  } catch {
    return false;
  }
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
 * immediately whenever the user logs food, water, or completes a workout.
 */
export function pushCurrentWidgetSnapshot(): void {
  if (!isNativeIos() || !hasCurrentUsername()) return;

  try {
    const hasProgram = hasStartDate();
    const day = hasProgram ? getCurrentProgramDay() : null;
    const session = getSession();

    const snapshot: GampetooWidgetSnapshot = {
      date: getTodayLocalDate(),
      workoutTitle: day?.title ?? "برنامه تنظیم نشده",
      workoutActivity: day?.activity === "workout" ? "workout" : "rest",
      workoutCompleted: session.completed === true,
      caloriesConsumed: Math.round(getTodaysTotalCalories()),
      caloriesTarget: Math.round(getCalorieTarget() ?? 0),
      proteinGrams: Math.round(getTodaysTotalProtein()),
      waterGlasses: getTodayGlasses(),
      waterGoal: getWaterGoal(),
      updatedAt: new Date().toISOString(),
    };

    void GampetooNative.updateWidgetSnapshot(snapshot).catch(() => {});
  } catch {
    // Snapshot sync is best-effort and must never interrupt the UI.
  }
}
