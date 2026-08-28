import type { FoodItem, ServingUnit } from "@/types/food";
import {
  foodNamesFa,
  localFoods,
  macrosForServing,
  supplementFoods,
} from "./foodSearch";
import { normalizeText } from "./mealTextParser";
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
  // Undefined when the matched food has no fiberPer100g at all (see
  // FoodItem) — distinct from 0, which means the food genuinely has none.
  fiber?: number;
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

// Shared with the text-import parser so a name is compared the same way no
// matter which flow produced it — that one also flattens the ZWNJ inside
// "سیب‌زمینی", which the catalog writes as two plain words.
const normalizeFa = normalizeText;

// Whether `shorter`'s words appear as a contiguous run inside `longer`'s —
// word-boundary-safe, unlike a raw substring check. A single generic word is
// never allowed to match this way against a longer, different compound: it
// mechanically WOULD "contain" it (e.g. "سیب" genuinely is the first word of
// "سیب زمینی"), which is exactly the bug this guards against — Gemini
// extracting "سیب زمینی" (potato) landed on the local "سیب" (apple) entry,
// a real but entirely unrelated food that only happens to share a first
// word. A 1-word name can therefore only match another 1-word name (already
// covered by the exact check above) or a genuine multi-word compound where
// every one of its own words is present.
function isWordRunMatch(a: string[], b: string[]): boolean {
  const [shorter, longer] = a.length <= b.length ? [a, b] : [b, a];

  if (shorter.length === 0 || shorter.length > longer.length) return false;
  if (shorter.length === 1 && longer.length > 1) return false;

  const longerText = ` ${longer.join(" ")} `;
  const shorterText = ` ${shorter.join(" ")} `;

  return longerText.includes(shorterText);
}

// Exact match first, then a word-safe fuzzy match against the local +
// learned databases — deliberately not foodSearch.ts's searchLocal(),
// which is built for live search-as-you-type (its last word is only ever a
// prefix, for a query still being typed) rather than matching a complete
// extracted name that may carry extra words on either side, e.g. Gemini
// saying "قرمه سبزی با گوشت گوسفندی" for a food logged as plain "قرمه سبزی".
// "امگا ۳ (روغن ماهی)" is the catalog's way of adding a note to a name, the
// same way "(بدون روغن)" is the user's — neither belongs in the comparison.
function withoutNotes(value: string): string {
  return normalizeFa(value.replace(/[（(][^）)]*[）)]/g, " "));
}

export function findLocalMatch(name: string): FoodItem | null {
  const normalized = normalizeFa(name);
  const normalizedWords = normalized.split(/\s+/).filter(Boolean);
  // Supplements included, unlike the browse/suggestion lists that
  // deliberately leave them out: nobody wants creatine suggested for lunch,
  // but a line that literally says "کراتین" must find it. Without this an
  // entire "مکمل صبح" row could only ever be resolved by guessing.
  const pool = [...localFoods, ...supplementFoods, ...getLearnedFoods()];

  // Aliases count as names here for the same reason they do in search: the
  // catalog's chosen name is not always the one people write ("برنج پخته"
  // vs "برنج سفید"). See FoodItem.aliases.
  const exact = pool.find((food) =>
    foodNamesFa(food).some((known) => withoutNotes(known) === normalized),
  );
  if (exact) return exact;

  const partial = pool.find((food) =>
    foodNamesFa(food).some((known) =>
      isWordRunMatch(withoutNotes(known).split(/\s+/).filter(Boolean), normalizedWords),
    ),
  );

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
    fiberPer100g: item.fiberPer100g,
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

export function findBestUnitMatch(food: FoodItem, unitLabel: string): ServingUnit {
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

/**
 * The local-only half of the matcher above: no network, no AI estimate, no
 * writes to the learned-foods store. What the text import runs first, so a
 * day written in the ordinary "<number> <unit> <food>" way resolves offline
 * and instantly, and only the leftovers cost an AI round trip.
 */
export function matchExtractedLocally(items: AiExtractedFoodItem[]): AiMatchResult {
  const matched: MatchedAiFoodItem[] = [];
  const unmatched: UnmatchedAiFoodItem[] = [];

  for (const item of items) {
    const food = findLocalMatch(item.name);

    if (!food) {
      unmatched.push({ extracted: item });
      continue;
    }

    const unit = findBestUnitMatch(food, item.unit);
    const quantity = item.quantity > 0 ? item.quantity : 1;

    matched.push({
      extracted: item,
      food,
      unit,
      quantity,
      estimated: false,
      ...macrosForServing(food, unit, quantity),
    });
  }

  return { matched, unmatched };
}
