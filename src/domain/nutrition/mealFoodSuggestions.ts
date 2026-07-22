import type { FoodItem } from "@/types/food";

// Which foods are typically eaten at each meal slot (see mealPlans.ts for
// the slot ids), in rough priority order — used to surface the most
// relevant foods first in the browsable (unfiltered) catalog list, instead
// of everyone always scrolling past the same alphabetical/insertion order
// regardless of which meal they're editing.
const MEAL_SUGGESTIONS: Record<string, string[]> = {
  "wake-up": ["dates", "banana"],

  breakfast: [
    "egg-white-raw",
    "boiled-egg",
    "oatmeal",
    "greek-yogurt",
    "yogurt",
    "banana",
    "whole-wheat-bread",
    "naan-sangak",
  ],

  "pre-workout": ["dates", "banana", "oatmeal", "rice-cakes"],

  "post-workout": [
    "chicken-breast-boiled",
    "chicken-breast-grilled",
    "whey-protein",
    "white-rice",
    "brown-rice-cooked",
    "sweet-potato-baked",
    "tuna-canned",
  ],

  lunch: [
    "chicken-breast-grilled",
    "chicken-fillet",
    "joojeh-kabab",
    "kubideh-kabab",
    "lean-ground-beef",
    "white-rice",
    "brown-rice-cooked",
    "sweet-potato-baked",
    "quinoa-cooked",
  ],

  snack: [
    "greek-yogurt",
    "cottage-cheese-lowfat",
    "almonds",
    "peanut-butter",
    "rice-cakes",
    "dates",
    "whey-protein",
  ],

  dinner: [
    "grilled-trout",
    "grilled-salmon",
    "tuna-canned",
    "chicken-breast-boiled",
    "quinoa-cooked",
    "sweet-potato-baked",
    "brown-rice-cooked",
  ],

  "before-bed": ["cottage-cheese-lowfat", "greek-yogurt", "milk"],
};

/**
 * Reorders foods so the ones typically eaten at this meal (see
 * MEAL_SUGGESTIONS) come first, in that priority order, followed by
 * everything else in its original order — Array.prototype.sort is a stable
 * sort, so unmatched foods never get shuffled relative to each other.
 */
export function sortFoodsForMeal(foods: FoodItem[], mealId: string): FoodItem[] {
  const priority = MEAL_SUGGESTIONS[mealId];

  if (!priority || priority.length === 0) return foods;

  const rank = new Map(priority.map((id, index) => [id, index]));

  return [...foods].sort(
    (a, b) => (rank.get(a.id) ?? Infinity) - (rank.get(b.id) ?? Infinity),
  );
}
