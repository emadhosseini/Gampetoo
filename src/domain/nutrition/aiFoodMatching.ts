import type { FoodItem, ServingUnit } from "@/types/food";
import { caloriesForServing, localFoods } from "./foodSearch";
import type { AiExtractedFoodItem } from "./aiFoodParser";

export interface MatchedAiFoodItem {
  extracted: AiExtractedFoodItem;
  food: FoodItem;
  unit: ServingUnit;
  quantity: number;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

export interface UnmatchedAiFoodItem {
  extracted: AiExtractedFoodItem;
}

export interface AiMatchResult {
  matched: MatchedAiFoodItem[];
  unmatched: UnmatchedAiFoodItem[];
}

function normalizeFa(value: string): string {
  return value.replace(/ي/g, "ی").replace(/ك/g, "ک").trim().toLowerCase();
}

function findBestFoodMatch(name: string): FoodItem | null {
  const normalized = normalizeFa(name);

  const exact = localFoods.find((food) => normalizeFa(food.nameFa) === normalized);
  if (exact) return exact;

  const partial = localFoods.find((food) => {
    const foodName = normalizeFa(food.nameFa);
    return foodName.includes(normalized) || normalized.includes(foodName);
  });

  return partial ?? null;
}

function findBestUnitMatch(food: FoodItem, unitLabel: string): ServingUnit {
  const normalized = normalizeFa(unitLabel);
  const exact = food.servingUnits.find((u) => normalizeFa(u.label) === normalized);
  return exact ?? food.servingUnits[0];
}

function macrosForServing(food: FoodItem, unit: ServingUnit, quantity: number) {
  const grams = (unit.grams * quantity) / 100;

  return {
    calories: caloriesForServing(food, unit, quantity),
    protein: Math.round(food.proteinPer100g * grams),
    carbs: Math.round(food.carbsPer100g * grams),
    fat: Math.round(food.fatPer100g * grams),
  };
}

// Matches Gemini's extracted (name, quantity, unit) triples against the
// app's existing local food database instead of trusting AI-guessed
// nutrition numbers — reuses caloriesForServing so calorie math stays
// identical to the manual add flow (AddMealEntryModal).
export function matchAiExtractedItems(items: AiExtractedFoodItem[]): AiMatchResult {
  const matched: MatchedAiFoodItem[] = [];
  const unmatched: UnmatchedAiFoodItem[] = [];

  for (const item of items) {
    const food = findBestFoodMatch(item.name);

    if (!food) {
      unmatched.push({ extracted: item });
      continue;
    }

    const unit = findBestUnitMatch(food, item.unit);
    const quantity = item.quantity > 0 ? item.quantity : 1;

    matched.push({ extracted: item, food, unit, quantity, ...macrosForServing(food, unit, quantity) });
  }

  return { matched, unmatched };
}
