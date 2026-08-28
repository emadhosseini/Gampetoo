import { setCalorieTarget, setCalorieTargetMode } from "./dailyLogEngine";
import { scopedKey, setCurrentUserGender, type Gender } from "./userEngine";
import { logWeight } from "./weightEngine";

// Only the two inputs this feature owns live here. The daily calorie
// target itself stays owned by dailyLogEngine (emad-daily-calorie-target)
// — this module computes the number and hands it over rather than writing
// that key directly, so it still has exactly one owner. Weight and gender
// likewise go back to their own engines, which is what lets one form here
// also fix a missing weigh-in. Age and height are read-only inputs owned
// by the profile — see saveCalorieProfile.
const ACTIVITY_LEVEL_KEY = "emad-user-activity-level";
const CALORIE_GOAL_KEY = "emad-user-calorie-goal";
const WEEKLY_LOSS_KEY = "emad-user-weekly-loss";

export type ActivityLevel = "sedentary" | "light" | "moderate" | "active";
export type CalorieGoal = "lose" | "maintain" | "gain";

export const ACTIVITY_MULTIPLIERS: Record<ActivityLevel, number> = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  active: 1.725,
};

// Daily surplus/deficit applied on top of TDEE. `lose` isn't here: its
// deficit comes from how fast the user wants to lose, below.
export const GOAL_ADJUSTMENTS: Record<CalorieGoal, number> = {
  lose: 0,
  maintain: 0,
  gain: 300,
};

/** Weekly fat-loss rates offered for the کاهش‌وزن goal, in grams. */
export const WEEKLY_LOSS_RATES = [250, 500, 750, 1000] as const;

export type WeeklyLossRate = (typeof WEEKLY_LOSS_RATES)[number];

export const DEFAULT_WEEKLY_LOSS: WeeklyLossRate = 500;

// The conventional figure for the energy stored in a kilogram of body fat.
// An approximation — real loss is never pure fat — but it's the standard
// one, and it's what makes "half a kilo a week" mean a specific number of
// calories rather than a vibe.
const KCAL_PER_KG_OF_FAT = 7700;

/** The daily deficit that adds up to `gramsPerWeek` of fat over seven days. */
export function dailyDeficitFor(gramsPerWeek: number): number {
  return Math.round((gramsPerWeek / 1000) * KCAL_PER_KG_OF_FAT / 7);
}

// Grams of protein per kilogram of bodyweight. Highest while cutting: in a
// deficit protein is what stops the weight coming off being muscle as well
// as fat. The gaining figure sits below it because the surplus itself is
// doing the work there.
const PROTEIN_G_PER_KG: Record<CalorieGoal, number> = {
  lose: 2.0,
  maintain: 1.6,
  gain: 1.8,
};

export interface ProteinTarget {
  /** Grams a day to aim for. */
  grams: number;
}

export function calculateProteinTarget(
  weightKg: number,
  goal: CalorieGoal,
): ProteinTarget {
  return { grams: Math.round(weightKg * PROTEIN_G_PER_KG[goal]) };
}

// Three-tier read on "how close is today to its target": under 80% is red,
// 80% up to the target is yellow (close but not there), the target and
// beyond is green — once it's hit, going over isn't penalized the way
// falling short is.
export type ProteinStanding = "under" | "near" | "reached";

const NEAR_TARGET_RATIO = 0.8;

export function standingForRatio(ratio: number): ProteinStanding {
  if (ratio >= 1) return "reached";

  return ratio >= NEAR_TARGET_RATIO ? "near" : "under";
}

export function proteinStanding(
  grams: number,
  target: ProteinTarget,
): ProteinStanding {
  return standingForRatio(target.grams > 0 ? grams / target.grams : 0);
}

// Same ratio-based judgment, used for calories and for carbs/fat/fiber
// against their manual gram targets — the ratio math isn't specific to
// protein, only the name proteinStanding is historical.
export function macroStanding(grams: number, targetGrams: number): ProteinStanding {
  return standingForRatio(targetGrams > 0 ? grams / targetGrams : 0);
}

// The one place the red/yellow/green meaning of a standing is spelled out
// as an actual color, so every screen that colors text or a ring by
// standing agrees with the others.
export const STANDING_COLOR: Record<ProteinStanding, string> = {
  under: "#f87171",
  near: "#fcd34d",
  reached: "#4ade80",
};

export const ACTIVITY_LEVEL_LABELS: Record<ActivityLevel, string> = {
  sedentary: "بی‌تحرک",
  light: "فعالیت سبک",
  moderate: "فعالیت متوسط",
  active: "فعالیت زیاد",
};

export const ACTIVITY_LEVEL_HINTS: Record<ActivityLevel, string> = {
  sedentary: "کار پشت میز، بدون ورزش",
  light: "۱ تا ۳ روز ورزش در هفته",
  moderate: "۳ تا ۵ روز ورزش در هفته",
  active: "۶ تا ۷ روز ورزش در هفته",
};

export const CALORIE_GOAL_LABELS: Record<CalorieGoal, string> = {
  lose: "کاهش وزن",
  maintain: "تثبیت وزن",
  gain: "عضله‌سازی",
};

export interface CalorieProfile {
  gender: Gender;
  age: number;
  heightCm: number;
  weightKg: number;
  activityLevel: ActivityLevel;
  goal: CalorieGoal;
  // How fast to lose, in grams a week. Only meaningful when goal is "lose";
  // the other two ignore it rather than each carrying a rate they'd never
  // use.
  weeklyLossGrams: number;
}

/**
 * Mifflin-St Jeor resting metabolic rate — the calories the body burns at
 * complete rest. Chosen over Harris-Benedict because it's the more
 * accurate of the two for modern populations.
 *
 *   male:   10×kg + 6.25×cm − 5×age + 5
 *   female: 10×kg + 6.25×cm − 5×age − 161
 */
export function calculateBmr(
  weightKg: number,
  heightCm: number,
  age: number,
  gender: Gender,
): number {
  const base = 10 * weightKg + 6.25 * heightCm - 5 * age;

  return Math.round(base + (gender === "male" ? 5 : -161));
}

/** Total daily energy expenditure: BMR scaled by how active the day is. */
export function calculateTdee(bmr: number, activityLevel: ActivityLevel): number {
  return Math.round(bmr * ACTIVITY_MULTIPLIERS[activityLevel]);
}

/**
 * TDEE shifted into a deficit or surplus by the chosen goal. Cutting takes
 * its deficit from the chosen weekly rate rather than one fixed number, so
 * "half a kilo a week" and "a kilo a week" are genuinely different targets
 * instead of the same one under two names.
 */
export function applyCalorieGoal(
  tdee: number,
  goal: CalorieGoal,
  weeklyLossGrams: number = DEFAULT_WEEKLY_LOSS,
): number {
  const adjustment =
    goal === "lose" ? -dailyDeficitFor(weeklyLossGrams) : GOAL_ADJUSTMENTS[goal];

  // Floored so an extreme combination (a small, sedentary person asking for
  // a kilo a week) can never produce a target that's unsafe to eat to. When
  // it bites, the real rate will be slower than asked for — which is the
  // right way round.
  return Math.max(1200, tdee + adjustment);
}

export interface CalorieCalculation {
  bmr: number;
  tdee: number;
  target: number;
}

/** The whole chain, without touching storage — useful for a live preview. */
export function calculateCalorieTarget(profile: CalorieProfile): CalorieCalculation {
  const bmr = calculateBmr(profile.weightKg, profile.heightCm, profile.age, profile.gender);
  const tdee = calculateTdee(bmr, profile.activityLevel);

  return {
    bmr,
    tdee,
    target: applyCalorieGoal(tdee, profile.goal, profile.weeklyLossGrams),
  };
}

export function getActivityLevel(): ActivityLevel | null {
  const value = localStorage.getItem(scopedKey(ACTIVITY_LEVEL_KEY));

  return value !== null && value in ACTIVITY_MULTIPLIERS ? (value as ActivityLevel) : null;
}

export function getWeeklyLossGrams(): WeeklyLossRate {
  const value = Number(localStorage.getItem(scopedKey(WEEKLY_LOSS_KEY)));

  return (WEEKLY_LOSS_RATES as readonly number[]).includes(value)
    ? (value as WeeklyLossRate)
    : DEFAULT_WEEKLY_LOSS;
}

export function getCalorieGoal(): CalorieGoal | null {
  const value = localStorage.getItem(scopedKey(CALORIE_GOAL_KEY));

  return value !== null && value in GOAL_ADJUSTMENTS ? (value as CalorieGoal) : null;
}

/**
 * Records which of the three goals the user is on, on its own.
 *
 * saveCalorieProfile below writes this as part of a full recalculation, but
 * the goal is also what the protein target is computed from — so the manual
 * "کالری هدف روزانه" flow, which states a calorie number outright and runs
 * no calculation at all, needs to be able to state the goal with it.
 * Without that, setting a target by hand left protein pinned to whatever
 * the last calculation (or the "maintain" default) had decided.
 */
export function setCalorieGoal(goal: CalorieGoal) {
  localStorage.setItem(scopedKey(CALORIE_GOAL_KEY), goal);
}

/**
 * Runs the calculation and persists everything it touches: the target goes
 * to dailyLogEngine, and each input the form actually collects goes back to
 * the engine that owns it — so filling this form in also records today's
 * weight and the gender the avatar uses.
 *
 * Age and height are deliberately not written back. The form reads them
 * from the profile rather than asking, so writing them here would only ever
 * echo the profile's own value back at it — or, when the profile has none,
 * persist this module's stand-in default as if the user had stated it.
 */
export function saveCalorieProfile(profile: CalorieProfile): CalorieCalculation {
  const calculation = calculateCalorieTarget(profile);

  setCurrentUserGender(profile.gender);
  logWeight(profile.weightKg);

  localStorage.setItem(scopedKey(ACTIVITY_LEVEL_KEY), profile.activityLevel);
  localStorage.setItem(scopedKey(CALORIE_GOAL_KEY), profile.goal);
  localStorage.setItem(
    scopedKey(WEEKLY_LOSS_KEY),
    String(profile.weeklyLossGrams),
  );

  // The calculator only ever produces one number, so running it always
  // switches back to "single" mode — otherwise a saved calculation could
  // silently do nothing if the user had dual targets active.
  setCalorieTargetMode("single");
  setCalorieTarget(calculation.target);

  return calculation;
}

export function resetCalorieProfile() {
  localStorage.removeItem(scopedKey(ACTIVITY_LEVEL_KEY));
  localStorage.removeItem(scopedKey(CALORIE_GOAL_KEY));
  localStorage.removeItem(scopedKey(WEEKLY_LOSS_KEY));
}
