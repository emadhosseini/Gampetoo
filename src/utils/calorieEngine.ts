import { setCalorieTarget } from "./dailyLogEngine";
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

export type ActivityLevel = "sedentary" | "light" | "moderate" | "active";
export type CalorieGoal = "lose" | "maintain" | "gain";

export const ACTIVITY_MULTIPLIERS: Record<ActivityLevel, number> = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  active: 1.725,
};

// Daily surplus/deficit applied on top of TDEE. Roughly half a kilo of fat
// a week for the deficit, and a lean-gain surplus rather than an
// aggressive bulk.
export const GOAL_ADJUSTMENTS: Record<CalorieGoal, number> = {
  lose: -500,
  maintain: 0,
  gain: 300,
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
  lose: "چربی‌سوزی",
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

/** TDEE shifted into a deficit or surplus by the chosen goal. */
export function applyCalorieGoal(tdee: number, goal: CalorieGoal): number {
  // Floored so an extreme input (very small, very sedentary person on a
  // deficit) can never produce a target that's unsafe to eat to.
  return Math.max(1200, tdee + GOAL_ADJUSTMENTS[goal]);
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

  return { bmr, tdee, target: applyCalorieGoal(tdee, profile.goal) };
}

export function getActivityLevel(): ActivityLevel | null {
  const value = localStorage.getItem(scopedKey(ACTIVITY_LEVEL_KEY));

  return value !== null && value in ACTIVITY_MULTIPLIERS ? (value as ActivityLevel) : null;
}

export function getCalorieGoal(): CalorieGoal | null {
  const value = localStorage.getItem(scopedKey(CALORIE_GOAL_KEY));

  return value !== null && value in GOAL_ADJUSTMENTS ? (value as CalorieGoal) : null;
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

  setCalorieTarget(calculation.target);

  return calculation;
}

export function resetCalorieProfile() {
  localStorage.removeItem(scopedKey(ACTIVITY_LEVEL_KEY));
  localStorage.removeItem(scopedKey(CALORIE_GOAL_KEY));
}
