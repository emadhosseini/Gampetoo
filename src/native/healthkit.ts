import { upsertSyncedActivityEntry } from "@/utils/activityLogEngine";
import { getTodayLocalDate } from "@/utils/dateFormat";

import { GampetooNative, type HealthKitTodaySummary } from "./nativePlugin";
import { isNativeIos } from "./platform";

const HEALTHKIT_ENABLED_KEY = "gampetoo-ios-healthkit-enabled";
const HEALTHKIT_CACHE_KEY = "gampetoo-ios-healthkit-summary";

export interface CachedHealthSummary {
  date: string;
  steps: number;
  activeCalories: number;
  waterMl: number;
  latestWeightKg?: number;
  syncedAt: string;
}

export function isHealthKitEnabled(): boolean {
  if (!isNativeIos()) return false;
  try {
    return localStorage.getItem(HEALTHKIT_ENABLED_KEY) === "1";
  } catch {
    return false;
  }
}

export function setHealthKitEnabled(enabled: boolean): void {
  try {
    localStorage.setItem(HEALTHKIT_ENABLED_KEY, enabled ? "1" : "0");
  } catch {
    // Ignore storage failures.
  }
}

export function getCachedHealthSummary(): CachedHealthSummary | null {
  try {
    const raw = localStorage.getItem(HEALTHKIT_CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as CachedHealthSummary;
    if (parsed.date !== getTodayLocalDate()) return null;
    return parsed;
  } catch {
    return null;
  }
}

function saveCachedHealthSummary(summary: HealthKitTodaySummary): CachedHealthSummary {
  const cached: CachedHealthSummary = {
    date: getTodayLocalDate(),
    steps: Math.max(0, Math.round(summary.steps ?? 0)),
    activeCalories: Math.max(0, Math.round(summary.activeCalories ?? 0)),
    waterMl: Math.max(0, Math.round(summary.waterMl ?? 0)),
    latestWeightKg: summary.latestWeightKg,
    syncedAt: new Date().toISOString(),
  };

  try {
    localStorage.setItem(HEALTHKIT_CACHE_KEY, JSON.stringify(cached));
  } catch {
    // Ignore storage failures.
  }

  return cached;
}

export async function enableHealthKit(): Promise<{
  ok: boolean;
  summary?: CachedHealthSummary;
  error?: string;
}> {
  if (!isNativeIos()) {
    return { ok: false, error: "فقط در نسخه iOS در دسترس است." };
  }

  try {
    const auth = await GampetooNative.requestHealthKitAuth();
    if (!auth.granted) {
      setHealthKitEnabled(false);
      return {
        ok: false,
        error: auth.error ?? "دسترسی Apple Health تأیید نشد.",
      };
    }

    setHealthKitEnabled(true);
    const summary = await syncHealthKitFromAppleHealth();
    return { ok: true, summary: summary ?? undefined };
  } catch {
    return { ok: false, error: "اتصال به Apple Health انجام نشد." };
  }
}

/**
 * Pulls today's steps and Apple Watch active calories burned from HealthKit,
 * updating today's deduplicated Apple Health activity entry in Gampetoo.
 */
export async function syncHealthKitFromAppleHealth(): Promise<CachedHealthSummary | null> {
  if (!isNativeIos() || !isHealthKitEnabled()) return null;

  try {
    const summary = await GampetooNative.syncHealthKitToday();
    if (!summary?.available) return null;

    const cached = saveCachedHealthSummary(summary);
    const todayDate = getTodayLocalDate();

    if (cached.activeCalories > 0) {
      const note =
        cached.steps > 0
          ? `Apple Watch / Health (${cached.steps.toLocaleString("fa-IR")} قدم)`
          : "Apple Watch / Health";
      upsertSyncedActivityEntry(
        `apple-health:${todayDate}`,
        cached.activeCalories,
        note,
        todayDate,
      );
    }

    return cached;
  } catch {
    return null;
  }
}

export function pushWaterToHealthKit(glasses: number): void {
  if (!isNativeIos() || !isHealthKitEnabled() || glasses <= 0) return;
  void GampetooNative.writeHealthKitWater({ glasses }).catch(() => {});
}

export function pushWeightToHealthKit(kg: number): void {
  if (!isNativeIos() || !isHealthKitEnabled() || kg <= 0) return;
  void GampetooNative.writeHealthKitWeight({ kg }).catch(() => {});
}

export function pushWorkoutToHealthKit(
  kind: "workout" | "walk",
  durationMinutes: number,
  calories: number,
  title: string,
): void {
  if (!isNativeIos() || !isHealthKitEnabled()) return;
  void GampetooNative.writeHealthKitWorkout({
    kind,
    durationMinutes,
    calories,
    title,
  }).catch(() => {});
}
