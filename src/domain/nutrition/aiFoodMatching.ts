import type { FoodItem, ServingUnit } from "@/types/food";
import { caloriesForServing, localFoods } from "./foodSearch";
import { searchExternalFoods } from "@/lib/openFoodFactsApi";
import { addLearnedFood, getLearnedFoods } from "@/store/learnedFoodsStore";
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

// Exact/substring match against the local + learned databases — deliberately
// NOT foodSearch.ts's searchLocal(), which only matches a word-prefix (built
// for live search-as-you-type) and would miss a full multi-word dish name
// like "قرمه سبزی" matched against itself.
function findLocalMatch(name: string): FoodItem | null {
  const normalized = normalizeFa(name);
  const pool = [...localFoods, ...getLearnedFoods()];

  const exact = pool.find((food) => normalizeFa(food.nameFa) === normalized);
  if (exact) return exact;

  const partial = pool.find((food) => {
    const foodName = normalizeFa(food.nameFa);
    return foodName.includes(normalized) || normalized.includes(foodName);
  });

  return partial ?? null;
}

// Falls back to the same external food API the manual add-food search uses
// (see foodSearch.ts) when nothing local matches, and saves a hit into the
// learned-foods store so this exact lookup never has to hit the network
// again — for this account, from either the AI flow or a manual search.
async function findBestFoodMatch(name: string): Promise<FoodItem | null> {
  const local = findLocalMatch(name);
  if (local) return local;

  const [found] = await searchExternalFoods(name, 1);

  if (found) addLearnedFood(found);

  return found ?? null;
}

function findBestUnitMatch(food: FoodItem, unitLabel: string): ServingUnit {
  const normalized = normalizeFa(unitLabel);

  const exact = food.servingUnits.find((u) => normalizeFa(u.label) === normalized);
  if (exact) return exact;

  // "قاشق" should still land on "قاشق غذاخوری", not silently fall through to
  // the default unit — same substring-either-direction leniency as the food
  // name match above.
  const partial = food.servingUnits.find((u) => {
    const label = normalizeFa(u.label);
    return label.includes(normalized) || normalized.includes(label);
  });

  return partial ?? food.servingUnits[0];
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
// app's food database instead of trusting AI-guessed nutrition numbers —
// reuses caloriesForServing so calorie math stays identical to the manual
// add flow (AddMealEntryModal). Local/learned matches resolve instantly;
// anything neither covers falls back to a live external lookup — run in
// parallel across items so a meal with several unmatched foods doesn't pay
// for each network round-trip sequentially. A name that fails everywhere
// becomes its own unmatched entry — it never blocks the rest of the meal
// from being logged.
export async function matchAiExtractedItems(
  items: AiExtractedFoodItem[],
): Promise<AiMatchResult> {
  const foods = await Promise.all(
    items.map((item) => findBestFoodMatch(item.name)),
  );

  const matched: MatchedAiFoodItem[] = [];
  const unmatched: UnmatchedAiFoodItem[] = [];

  items.forEach((item, i) => {
    const food = foods[i];

    if (!food) {
      unmatched.push({ extracted: item });
      return;
    }

    const unit = findBestUnitMatch(food, item.unit);
    const quantity = item.quantity > 0 ? item.quantity : 1;

    matched.push({
      extracted: item,
      food,
      unit,
      quantity,
      ...macrosForServing(food, unit, quantity),
    });
  });

  return { matched, unmatched };
}
