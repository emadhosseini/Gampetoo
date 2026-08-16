// Bridges the *prescribed* plan (program.nutrition — what the user is
// supposed to eat) to the *log* (dailyLogEngine — what they actually ate).
// Tapping a food on the nutrition page is the shortest possible path
// between the two, and it needs three things this module owns: the
// catalog entry behind a planned food (so an amount change can be
// re-priced properly), which log slot the entry belongs in, and how to
// read a stored amount string back apart.

import { DAILY_MODE_SLOT } from "@/data/nutrition/foodCatalog";
import { localFoods, supplementFoods } from "@/domain/nutrition/foodSearch";
import { getLearnedFoods } from "@/store/learnedFoodsStore";
import { getCalorieTrackingMode } from "@/utils/calorieModeEngine";
import type { FoodItem } from "@/types/food";

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
// lookup that was never learned, a database entry since renamed away). The
// caller falls back to scaling the plan's own stored calories in that case.
export function findCatalogFood(id: string): FoodItem | null {
  return (
    [...localFoods, ...supplementFoods, ...getLearnedFoods()].find(
      (food) => food.id === id,
    ) ?? null
  );
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
