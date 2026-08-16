// Bridges the *prescribed* plan (program.nutrition — what the user is
// supposed to eat) to the *log* (dailyLogEngine — what they actually ate).
// Tapping a food on the nutrition page is the shortest possible path
// between the two, and it needs three things this module owns: the
// catalog entry behind a planned food (so an amount change can be
// re-priced properly), which log slot the entry belongs in, and how to
// read a stored amount string back apart.

import { DAILY_MODE_SLOT } from "@/data/nutrition/foodCatalog";
import { mealPlans } from "@/data/nutrition/mealPlans";
import {
  foodNamesFa,
  localFoods,
  supplementFoods,
} from "@/domain/nutrition/foodSearch";
import { getLearnedFoods } from "@/store/learnedFoodsStore";
import { getCalorieTrackingMode } from "@/utils/calorieModeEngine";
import { normalizeFa } from "@/utils/persianSearch";
import type { FoodItem } from "@/types/food";
import type { EntryMacros } from "@/utils/dailyLogEngine";

const AMOUNT_PATTERN = /^(\d+(?:\.\d+)?)\s+(.+)$/;

// A persisted amount string is always "<quantity> <unit label>" — split it
// back apart so a quantity input and unit dropdown can be driven from it.
// Anything that doesn't parse (free text from an older plan) is treated as
// a single serving of a unit literally named that.
export function parseAmount(amount: string): {
  quantity: number;
  unitLabel: string;
} {
  const match = amount.match(AMOUNT_PATTERN);

  return match
    ? { quantity: Number(match[1]), unitLabel: match[2] }
    : { quantity: 1, unitLabel: amount };
}

// The full catalog entry a planned food came from, or null when it can't be
// found — a plan can outlive the catalog row it was built from (an external
// lookup that was never learned, a database entry since renamed away).
//
// Matched by name as well as by id, and that second pass is not a nicety:
// the built-in default plans (mealPlans.ts) were written by hand with their
// own ad-hoc ids ("egg", "oats") that were never catalog ids, so an id-only
// lookup finds nothing for any food in them — which is exactly how a food
// logged off the default plan ended up contributing calories and no macros
// at all.
export function findCatalogFood(id: string, name?: string): FoodItem | null {
  const catalog = [...localFoods, ...supplementFoods, ...getLearnedFoods()];

  const byId = catalog.find((food) => food.id === id);
  if (byId || !name) return byId ?? null;

  const target = normalizeFa(name);

  return (
    catalog.find((food) =>
      foodNamesFa(food).some((known) => normalizeFa(known) === target),
    ) ?? null
  );
}

// Macros for a serving worth `calories` of this food, derived from its
// per-100g composition. The way out of the unit mismatch a name-matched
// food brings with it: the plan says "۶۰ گرم" but the catalog entry may
// count that food in پیمانه, and reading the plan's quantity against the
// wrong unit would be far more wrong than reading it against none. Calories
// are the one figure both sides agree on, so they anchor the conversion.
export function macrosFromCalories(
  entry: FoodItem,
  calories: number,
): { calories: number; protein: number; carbs: number; fat: number; fiber?: number } {
  const grams = entry.caloriesPer100g > 0 ? calories / entry.caloriesPer100g : 0;

  return {
    calories: Math.round(calories),
    protein: Math.round(entry.proteinPer100g * grams),
    carbs: Math.round(entry.carbsPer100g * grams),
    fat: Math.round(entry.fatPer100g * grams),
    fiber:
      entry.fiberPer100g !== undefined
        ? Math.round(entry.fiberPer100g * grams)
        : undefined,
  };
}

// The macros the built-in plans record for a food, rescaled to `calories`
// worth of it. Every user's saved program is a copy of those plans taken at
// setup time, and copies taken before the plans carried macros at all still
// hold calorie-only foods with no catalog entry to fall back on ("egg",
// "oats" were never catalog ids — see findCatalogFood). This is what keeps
// those accounts logging real protein/carbs/fat instead of zeros, without
// rewriting anyone's stored plan behind their back.
export function findSeedFoodMacros(
  id: string,
  calories: number,
): EntryMacros | null {
  for (const plan of Object.values(mealPlans)) {
    for (const meal of plan.meals) {
      const seed = meal.foods.find((food) => food.id === id);

      if (!seed || seed.protein === undefined) continue;

      // Ratio against the seed's own calorie figure, so a plan whose amount
      // was since changed still scales instead of reporting the original
      // portion's macros.
      const ratio = seed.calories ? calories / seed.calories : 1;
      const scale = (value: number | undefined) =>
        value === undefined ? undefined : Math.round(value * ratio);

      return {
        calories: Math.round(calories),
        protein: scale(seed.protein),
        carbs: scale(seed.carbs),
        fat: scale(seed.fat),
        fiber: scale(seed.fiber),
      };
    }
  }

  return null;
}

// Which slot in the daily log a food eaten at `mealId` should be recorded
// under. In per-meal mode that's the meal itself (the plan's meal ids and
// the log's slot ids are the same id space — both come from getMealSlots);
// in daily mode every food lands in the one unified slot, which is exactly
// what the rest of that mode's UI reads from. Mode unset (the user hasn't
// been through the picker yet) is treated as per-meal, the more specific of
// the two — nothing is lost if they later pick daily, since DailyTotalsCard
// sums whatever slots the active mode lists.
export function resolveLogSlotId(mealId: string): string {
  return getCalorieTrackingMode() === "daily" ? DAILY_MODE_SLOT.id : mealId;
}
