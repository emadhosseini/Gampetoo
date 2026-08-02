import { scopedKey } from "./userEngine";

const MODE_KEY = "emad-calorie-mode";

export type CalorieTrackingMode = "perMeal" | "daily";

export function getCalorieTrackingMode(): CalorieTrackingMode | null {
  const value = localStorage.getItem(scopedKey(MODE_KEY));

  return value === "perMeal" || value === "daily" ? value : null;
}

export function setCalorieTrackingMode(mode: CalorieTrackingMode) {
  localStorage.setItem(scopedKey(MODE_KEY), mode);
}

export function resetCalorieTrackingMode() {
  localStorage.removeItem(scopedKey(MODE_KEY));
}
