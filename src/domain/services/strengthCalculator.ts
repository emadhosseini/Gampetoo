/**
 * Overall Strength Index — pure calculation, no storage/UI concerns. Same
 * shape as calorieCalculator.ts: callers (an engine in utils/) own
 * gathering the raw logs and persisting/deriving anything from the
 * result; this file only ever turns numbers into other numbers.
 */

/**
 * Estimated one-rep max via the Epley formula — the standard estimate for
 * "how strong you are" from an ordinary multi-rep set, without asking
 * anyone to actually attempt a true 1RM.
 */
export function calculate1RM(weight: number, reps: number): number {
  return weight * (1 + reps / 30);
}

export type StrengthCategory = "upper" | "lower" | "core";

// One exercise's best-known weight/reps pair (its personal record) for
// whichever category it belongs to — the raw material
// getOverallStrengthStats turns into a per-category average.
export interface StrengthCategoryLog {
  category: StrengthCategory;
  weight: number;
  reps: number;
}

export interface RadarStrengthPoint {
  subject: string;
  A: number;
  fullMark: number;
  // A / fullMark as a whole-number percentage (0–100) — the same ratio
  // the radar shape itself encodes visually, spelled out as a number for
  // a beginner who wouldn't otherwise read "how far out is this spoke" at
  // a glance.
  percentage: number;
}

const CATEGORY_LABELS: Record<StrengthCategory, string> = {
  upper: "بالاتنه",
  lower: "پایین‌تنه",
  core: "هسته بدن",
};

// The radar's fixed outer ring — a generous ceiling above what an
// averaged, mixed-exercise 1RM realistically reaches, so the three spokes
// stay comparable against one shared scale instead of each rescaling
// around whatever its own max happens to be.
const FULL_MARK = 150;

/**
 * Averages each category's logged personal records (already converted to
 * 1RM) into one radar point per category — always all three, in a fixed
 * order, even when a category has no logs yet (average 0 rather than a
 * missing spoke).
 */
export function getOverallStrengthStats(logs: StrengthCategoryLog[]): RadarStrengthPoint[] {
  const categories: StrengthCategory[] = ["upper", "lower", "core"];

  return categories.map((category) => {
    const oneRepMaxes = logs
      .filter((log) => log.category === category)
      .map((log) => calculate1RM(log.weight, log.reps));

    const average =
      oneRepMaxes.length > 0
        ? Math.round(oneRepMaxes.reduce((sum, value) => sum + value, 0) / oneRepMaxes.length)
        : 0;

    const percentage = Math.round((Math.min(average, FULL_MARK) / FULL_MARK) * 100);

    return { subject: CATEGORY_LABELS[category], A: average, fullMark: FULL_MARK, percentage };
  });
}

// The three category averages added together — the one number the
// gamification layer (getStrengthLevel) is judged against. A plain sum,
// not an average, so improving any one category always moves the total
// rather than being diluted by the other two staying flat.
export function getTotalScore(stats: RadarStrengthPoint[]): number {
  return stats.reduce((sum, point) => sum + point.A, 0);
}

// Three spokes at FULL_MARK each — the denominator behind the "۳۰۴ / ۴۵۰"
// fraction shown above the chart, so a beginner has something concrete to
// read the total score against instead of a bare, unanchored number.
export function getMaxPossibleScore(stats: RadarStrengthPoint[]): number {
  return stats.reduce((sum, point) => sum + point.fullMark, 0);
}

interface LevelTier {
  min: number;
  name: string;
  emoji: string;
}

// Ordered lowest to highest — getStrengthLevel below depends on that order
// to find "current" (the last tier at or under the score) and "next" (the
// one right after it) by a single linear scan.
const LEVEL_TIERS: LevelTier[] = [
  { min: 0, name: "برنزی", emoji: "🥉" },
  { min: 300, name: "نقره‌ای", emoji: "🥈" },
  { min: 600, name: "طلایی", emoji: "🥇" },
  { min: 900, name: "الماس", emoji: "💎" },
];

export interface StrengthLevelInfo {
  levelName: string;
  levelEmoji: string;
  // null once the top tier (الماس) is reached — there's no "next" beyond
  // it, and pointsToNextLevel is 0 to match (nothing further to close).
  nextLevelName: string | null;
  pointsToNextLevel: number;
  // 0–100: how far through the current tier's own span (from its own
  // start up to the next tier's start) the total score has gotten — what
  // the level progress bar's width is driven by. 100 once the top tier is
  // reached (a full, not empty, bar reads as "done" rather than "stuck").
  levelProgressPercentage: number;
}

/**
 * Which of the four tiers a total score falls into, plus how far off the
 * next one is — the gamification badge and its "X امتیاز تا سطح بعدی"
 * caption are built entirely from this, so the level thresholds only ever
 * need editing in one place.
 */
export function getStrengthLevel(totalScore: number): StrengthLevelInfo {
  let current = LEVEL_TIERS[0];
  let next: LevelTier | undefined;

  for (let i = 0; i < LEVEL_TIERS.length; i++) {
    if (totalScore >= LEVEL_TIERS[i].min) {
      current = LEVEL_TIERS[i];
      next = LEVEL_TIERS[i + 1];
    }
  }

  const levelProgressPercentage = next
    ? Math.round(
        (Math.max(0, totalScore - current.min) / (next.min - current.min)) * 100,
      )
    : 100;

  return {
    levelName: current.name,
    levelEmoji: current.emoji,
    nextLevelName: next?.name ?? null,
    pointsToNextLevel: next ? next.min - totalScore : 0,
    levelProgressPercentage,
  };
}

/**
 * A friendly one-line Persian summary naming the strongest and weakest of
 * the three categories — the "قوی‌ترین/ضعیف‌ترین" comparison a radar shape
 * communicates visually but a first-time user might not read at a glance.
 * Picks the first point as both when every category ties (nothing to
 * contrast yet, e.g. a brand-new account still on the mock zeros/mock
 * data) rather than naming the same category as both strongest and
 * weakest, which reads as a bug rather than an actual tie.
 */
export function generateSmartInsight(stats: RadarStrengthPoint[]): string {
  if (stats.length === 0) {
    return "هنوز داده‌ای برای تحلیل ثبت نشده — چند ست تمرین رو ثبت کن تا تحلیلت آماده بشه!";
  }

  const strongest = stats.reduce((a, b) => (b.A > a.A ? b : a));
  const weakest = stats.reduce((a, b) => (b.A < a.A ? b : a));

  if (strongest.subject === weakest.subject) {
    return "هنوز داده‌ی کافی برای مقایسه‌ی بخش‌های بدنت نیست — با ثبت چند ست دیگه، تحلیل دقیق‌تر می‌شه!";
  }

  return `${strongest.subject}‌ات این ماه عالی پیشرفت کرده، اما برای تعادل بهتر، باید روی ${weakest.subject} بیشتر تمرکز کنی! 💪`;
}
