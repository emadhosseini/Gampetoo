import { getLibrary } from "@/store/workoutLibraryStore";
import { getPersonalRecord } from "./exerciseSetLogEngine";
import {
  generateSmartInsight,
  getMaxPossibleScore,
  getOverallStrengthStats,
  getStrengthLevel,
  getTotalScore,
  type RadarStrengthPoint,
  type StrengthCategory,
  type StrengthCategoryLog,
  type StrengthLevelInfo,
} from "@/domain/services/strengthCalculator";

// Which of the three radar spokes a workout-library group belongs to,
// decided by keyword match against the group's own title — this is the
// one place that mapping lives, so recategorizing a muscle group later
// means editing these three lists, not hunting through the chart code.
const UPPER_KEYWORDS = [
  "سینه",
  "پشت",
  "شانه",
  "سرشانه",
  "بازو",
  "ساعد",
  "بالا تنه",
  "بالاتنه",
];
const LOWER_KEYWORDS = ["پا", "ران", "پایین تنه", "پایین‌تنه"];
const CORE_KEYWORDS = ["شکم", "مرکزی", "هسته", "core"];

function categorizeGroupTitle(title: string): StrengthCategory | null {
  if (CORE_KEYWORDS.some((kw) => title.includes(kw))) return "core";
  if (LOWER_KEYWORDS.some((kw) => title.includes(kw))) return "lower";
  if (UPPER_KEYWORDS.some((kw) => title.includes(kw))) return "upper";

  return null;
}

// exerciseId -> which spoke it counts toward, built fresh from the
// current library each time rather than cached — the library itself
// barely changes at runtime (only via workoutLibraryStore's own
// overrides), so there's no real cost to keeping this simple.
function buildExerciseCategoryMap(): Map<string, StrengthCategory> {
  const map = new Map<string, StrengthCategory>();

  for (const workout of getLibrary()) {
    for (const group of workout.groups) {
      const category = categorizeGroupTitle(group.title);

      if (!category) continue;

      for (const exercise of group.exercises) {
        // First match wins — the same exercise can appear in more than one
        // workout's groups (e.g. a compound move filed under both a push
        // and an upper-body day); it should only count once per spoke, not
        // once per place it happens to be listed.
        if (!map.has(exercise.id)) {
          map.set(exercise.id, category);
        }
      }
    }
  }

  return map;
}

/**
 * Every exercise's personal record (see exerciseSetLogEngine), mapped to
 * whichever spoke its workout-library group belongs to — the raw
 * StrengthCategoryLog[] the pure domain calculator turns into radar
 * points. An exercise with no PR yet (never confirmed a set) or that
 * doesn't map to any of the three categories (warm-ups, "تمام بدن"/"حرکات"
 * generic groups with no specific body part in their title) contributes
 * nothing — there's no real number to average in for it.
 */
function getStrengthCategoryLogs(): StrengthCategoryLog[] {
  const categoryByExerciseId = buildExerciseCategoryMap();
  const logs: StrengthCategoryLog[] = [];

  for (const [exerciseId, category] of categoryByExerciseId) {
    const pr = getPersonalRecord(exerciseId);

    if (!pr) continue;

    logs.push({ category, weight: pr.weight, reps: pr.reps });
  }

  return logs;
}

/**
 * The radar chart's actual data — real personal records averaged per
 * category. A fresh account with nothing logged yet gets real zeros for
 * all three (getOverallStrengthStats already returns 0 for a category
 * with no logs, not a missing spoke), not placeholder numbers standing in
 * for progress that was never made — a "شاخص قدرت: ۳۰۴" on an account
 * that hasn't touched the app yet is a real, confusing lie, not a demo.
 */
export function getOverallStrengthChartData(): RadarStrengthPoint[] {
  return getOverallStrengthStats(getStrengthCategoryLogs());
}

export interface StrengthDashboardData {
  chartData: RadarStrengthPoint[];
  totalScore: number;
  maxScore: number;
  level: StrengthLevelInfo;
  insight: string;
}

/**
 * Everything OverallStrengthRadar needs to render — gathered here, once,
 * so the component itself never touches a domain function directly. All
 * four of the domain calls below (getTotalScore, getMaxPossibleScore,
 * getStrengthLevel, generateSmartInsight) are pure and take chartData (or
 * totalScore, itself derived from chartData) as their only input, which
 * is exactly why this can just chain them.
 */
export function getStrengthDashboardData(): StrengthDashboardData {
  const chartData = getOverallStrengthChartData();
  const totalScore = getTotalScore(chartData);

  return {
    chartData,
    totalScore,
    maxScore: getMaxPossibleScore(chartData),
    level: getStrengthLevel(totalScore),
    insight: generateSmartInsight(chartData),
  };
}
