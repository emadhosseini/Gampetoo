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
  // True when this food came from neither the local/learned database nor
  // the external API — Gemini's own guess, used only as a last resort. The
  // UI must label this differently from a real database match.
  estimated: boolean;
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

// Builds a FoodItem straight out of Gemini's own per-item estimate — only
// possible when every macro field survived normalizeEstimate() (see
// aiFoodParser.ts). One serving unit only, matching exactly what Gemini
// itself reported, so findBestUnitMatch below always resolves it via an
// exact label match.
function buildEstimatedFood(item: AiExtractedFoodItem): FoodItem | null {
  if (
    item.unitGrams === undefined ||
    item.caloriesPer100g === undefined ||
    item.proteinPer100g === undefined ||
    item.carbsPer100g === undefined ||
    item.fatPer100g === undefined
  ) {
    return null;
  }

  return {
    id: `ai-est-${normalizeFa(item.name).replace(/\s+/g, "-")}`,
    nameFa: item.name,
    nameEn: item.name,
    category: "main_dish",
    servingUnits: [{ label: item.unit, grams: item.unitGrams }],
    caloriesPer100g: item.caloriesPer100g,
    proteinPer100g: item.proteinPer100g,
    carbsPer100g: item.carbsPer100g,
    fatPer100g: item.fatPer100g,
  };
}

interface FoodMatch {
  food: FoodItem;
  estimated: boolean;
}

// Three tiers, cheapest/most-trustworthy first: local+learned database (no
// network, real data) → external API (network, real data — see
// foodSearch.ts's searchExternalFoods) → Gemini's own estimate (no extra
// network call, since it came back with the original parse, but a guess
// rather than looked-up data). Either of the last two gets saved into the
// learned-foods store so this exact food resolves locally next time, from
// either the AI flow or a manual search.
async function findBestFoodMatch(
  item: AiExtractedFoodItem,
): Promise<FoodMatch | null> {
  const local = findLocalMatch(item.name);
  if (local) return { food: local, estimated: false };

  const [external] = await searchExternalFoods(item.name, 1);
  if (external) {
    addLearnedFood(external);
    return { food: external, estimated: false };
  }

  const estimate = buildEstimatedFood(item);
  if (estimate) {
    addLearnedFood(estimate);
    return { food: estimate, estimated: true };
  }

  return null;
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

// Matches Gemini's extracted items against the app's food database instead
// of trusting AI-guessed nutrition numbers by default — reuses
// caloriesForServing so calorie math stays identical to the manual add flow
// (AddMealEntryModal). Local/learned matches resolve instantly; anything
// neither covers falls back to a live external lookup, and only Gemini's
// own estimate as a last resort — run in parallel across items so a meal
// with several unmatched foods doesn't pay for each network round-trip
// sequentially. A name with no local/external/estimate match at all becomes
// its own unmatched entry — it never blocks the rest of the meal from being
// logged.
export async function matchAiExtractedItems(
  items: AiExtractedFoodItem[],
): Promise<AiMatchResult> {
  const matches = await Promise.all(items.map(findBestFoodMatch));

  const matched: MatchedAiFoodItem[] = [];
  const unmatched: UnmatchedAiFoodItem[] = [];

  items.forEach((item, i) => {
    const match = matches[i];

    if (!match) {
      unmatched.push({ extracted: item });
      return;
    }

    const { food, estimated } = match;
    const unit = findBestUnitMatch(food, item.unit);
    const quantity = item.quantity > 0 ? item.quantity : 1;

    matched.push({
      extracted: item,
      food,
      unit,
      quantity,
      estimated,
      ...macrosForServing(food, unit, quantity),
    });
  });

  return { matched, unmatched };
}
