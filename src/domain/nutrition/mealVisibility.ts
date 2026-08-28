import { getMealSlots, type MealSlot } from "@/data/nutrition/foodCatalog";
import { getMealDisplaySettings } from "@/utils/appSettingsEngine";
import { getProgramDay, hasProgramStarted } from "@/utils/programEngine";

// Which meals a given day actually shows. One answer, shared by the daily
// log and the plan view, so a meal turned off can't come back on the other
// screen.

// The two slots that only exist because of training. Everything else is
// eaten on any kind of day.
export const WORKOUT_MEAL_IDS = ["pre-workout", "post-workout"];

/** Whether the program has this date down as a training day. */
export function isWorkoutDay(date: Date): boolean {
  // A program that hasn't started yet has no training days to speak of —
  // the nutrition page already falls back to the rest-day plan in that
  // state, and this agrees with it.
  return hasProgramStarted(date) && getProgramDay(date).activity === "workout";
}

/**
 * Every meal id hidden for this date: the ones switched off by hand, plus
 * the training meals on a rest day when that option is on.
 *
 * Date-aware rather than "today"-only because the daily log can be pointed
 * at any day through its date picker — looking back at last Tuesday should
 * show the meals that Tuesday had.
 */
export function hiddenMealIdsFor(date: Date = new Date()): string[] {
  const { hiddenMealIds, hideWorkoutMealsOnRestDays } = getMealDisplaySettings();

  if (!hideWorkoutMealsOnRestDays || isWorkoutDay(date)) return hiddenMealIds;

  return [...new Set([...hiddenMealIds, ...WORKOUT_MEAL_IDS])];
}

export function visibleMealSlots(date: Date = new Date()): MealSlot[] {
  const hidden = hiddenMealIdsFor(date);

  return getMealSlots().filter((slot) => !hidden.includes(slot.id));
}
