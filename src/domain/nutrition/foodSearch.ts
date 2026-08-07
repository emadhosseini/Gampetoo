import type { FoodItem, ServingUnit } from "@/types/food";
import { iranianFoodsDatabase } from "@/data/nutrition/iranianFoodsDatabase";
import { internationalFoodsDatabase } from "@/data/nutrition/internationalFoodsDatabase";
import { gymFoodsDatabase } from "@/data/nutrition/gymFoodsDatabase";
import { supplementsDatabase } from "@/data/nutrition/supplementsDatabase";
import { searchExternalFoods } from "@/lib/openFoodFactsApi";
import { getLearnedFoods } from "@/store/learnedFoodsStore";

const MIN_LOCAL_RESULTS_BEFORE_EXTERNAL_LOOKUP = 5;

// Shared by every screen that searches this catalog (NutritionPlanDetailPage,
// AddMealEntryModal, ...) so their live-search behavior/timing stays in sync.
export const AUTO_SEARCH_MIN_LENGTH = 3;
export const SEARCH_DEBOUNCE_MS = 300;

// A food's macros are stored per 100g — this converts a (unit, quantity)
// serving into an actual calorie count.
export function caloriesForServing(
  entry: FoodItem,
  unit: ServingUnit,
  quantity: number,
): number {
  return Math.round((entry.caloriesPer100g * unit.grams * quantity) / 100);
}

export interface ServingMacros {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  // Undefined when the food has no fiberPer100g at all (see FoodItem) —
  // distinct from 0, which means the food genuinely has none.
  fiber?: number;
}

// Same per-100g -> per-serving conversion as caloriesForServing, but for
// every macro at once — the one place that math happens, shared by the
// manual add flow (AddMealEntryModal) and the AI-matched flow
// (aiFoodMatching.ts) so a logged entry carries the same numbers regardless
// of which screen logged it.
export function macrosForServing(
  entry: FoodItem,
  unit: ServingUnit,
  quantity: number,
): ServingMacros {
  const grams = (unit.grams * quantity) / 100;

  return {
    calories: caloriesForServing(entry, unit, quantity),
    protein: Math.round(entry.proteinPer100g * grams),
    carbs: Math.round(entry.carbsPer100g * grams),
    fat: Math.round(entry.fatPer100g * grams),
    fiber:
      entry.fiberPer100g !== undefined
        ? Math.round(entry.fiberPer100g * grams)
        : undefined,
  };
}

// All three databases are bilingual (real Persian translations, not just the
// English name reused) — the external API is only a fallback for foods none
// of them cover. Exported so screens can show the full browsable list before
// the user has typed a search query.
export const localFoods: FoodItem[] = [
  ...iranianFoodsDatabase,
  ...internationalFoodsDatabase,
  ...gymFoodsDatabase,
];

// Kept out of localFoods deliberately — supplements/vitamins belong to their
// own "مکمل و ویتامین‌ها" meal slot, not the regular per-meal food search
// (you wouldn't want creatine suggested for lunch).
export const supplementFoods: FoodItem[] = supplementsDatabase;

function normalizeFa(value: string): string {
  return value.replace(/ي/g, "ی").replace(/ك/g, "ک").trim().toLowerCase();
}

function isEnglishQuery(query: string): boolean {
  // Any Persian/Arabic-range character means it's not a purely-English query.
  return !/[؀-ۿ]/.test(query) && /[a-zA-Z]/.test(query);
}

// Matches only at the start of a word (never mid-word) — e.g. querying "بز"
// must NOT match "قرمه سبزی" (it sits inside "سبزی"), but "سبز" must, since
// it's a prefix of that second word. Leading punctuation (parentheses, etc.)
// around a word is ignored so it doesn't shadow a real word-boundary match.
//
// The query itself can be multiple words too — typing a two/three-word dish
// name like "قرمه سبزی" or "جوجه کباب" has to find that dish. Every query
// word but the last must equal the name's word in the same position
// (someone typing "سیب زمینی" has committed to "سیب" being a whole word,
// not just a prefix of it); the last query word only needs to be a prefix,
// same as the single-word case, so results still update as the last word is
// still being typed. The matching run of name-words can start anywhere in
// the name, not just its first word, so "سبزی" alone still finds "قرمه
// سبزی". (Previously this only ever compared the query as one whole string
// against a single name-word, so it silently could not match ANY multi-word
// query at all — "قرمه سبزی" searched against itself came back empty.)
function matchesWordPrefix(name: string, query: string): boolean {
  const queryWords = query.split(/\s+/).filter(Boolean);
  if (queryWords.length === 0) return false;

  const nameWords = name
    .split(/\s+/)
    .map((word) => word.replace(/^[^\p{L}\p{N}]+/u, ""));

  const leadingQueryWords = queryWords.slice(0, -1);
  const lastQueryWord = queryWords[queryWords.length - 1];

  for (let start = 0; start + queryWords.length <= nameWords.length; start++) {
    const leadingMatch = leadingQueryWords.every(
      (word, offset) => nameWords[start + offset] === word,
    );
    const lastMatch = nameWords[start + leadingQueryWords.length].startsWith(lastQueryWord);

    if (leadingMatch && lastMatch) return true;
  }

  return false;
}

function searchLocal(query: string): FoodItem[] {
  const qFa = normalizeFa(query);
  const qEn = query.trim().toLowerCase();

  if (!qFa) return [];

  // Learned foods (discovered via an external lookup elsewhere — see
  // learnedFoodsStore.ts) count as local from here on, so a manual search
  // benefits from anything the AI meal-parsing flow already found.
  return [...localFoods, ...getLearnedFoods()].filter(
    (food) =>
      matchesWordPrefix(normalizeFa(food.nameFa), qFa) ||
      matchesWordPrefix(food.nameEn.toLowerCase(), qEn),
  );
}

// Supplements are a small, fixed, curated list — a plain local filter is
// enough, no need for the external-API fallback searchFood() uses for the
// much larger, open-ended regular food catalog.
export function searchSupplements(query: string): FoodItem[] {
  const qFa = normalizeFa(query);
  const qEn = query.trim().toLowerCase();

  if (!qFa) return [];

  return supplementFoods.filter(
    (food) =>
      matchesWordPrefix(normalizeFa(food.nameFa), qFa) ||
      matchesWordPrefix(food.nameEn.toLowerCase(), qEn),
  );
}

export interface FoodSearchResult {
  results: FoodItem[];
  source: "local" | "hybrid";
  externalError: boolean;
}

/**
 * Searches the local Iranian foods database first, and only reaches out to
 * the external (Open Food Facts) API when that alone doesn't look like
 * enough — either too few local matches, or a query that's plainly English
 * (unlikely to be one of the Persian-named local dishes at all). A failed
 * or offline external lookup never surfaces as an error: it just falls back
 * to whatever the local database already found.
 */
export async function searchFood(query: string): Promise<FoodSearchResult> {
  const trimmed = query.trim();

  if (!trimmed) {
    return { results: [], source: "local", externalError: false };
  }

  const localResults = searchLocal(trimmed);

  const needsExternalLookup =
    localResults.length < MIN_LOCAL_RESULTS_BEFORE_EXTERNAL_LOOKUP ||
    isEnglishQuery(trimmed);

  if (!needsExternalLookup) {
    return { results: localResults, source: "local", externalError: false };
  }

  let externalResults: FoodItem[] = [];
  let externalError = false;

  try {
    externalResults = await searchExternalFoods(trimmed);
  } catch {
    // searchExternalFoods already swallows its own errors and returns [], so
    // this catch is just an extra safety net — searchFood must never throw
    // regardless of what changes underneath it.
    externalError = true;
  }

  const seenNames = new Set(localResults.map((f) => f.nameFa.toLowerCase()));
  const merged = [
    ...localResults,
    ...externalResults.filter((f) => !seenNames.has(f.nameFa.toLowerCase())),
  ];

  return {
    results: merged,
    source: "hybrid",
    externalError,
  };
}
