import type { FoodItem } from "@/types/food";
import { iranianFoodsDatabase } from "@/data/nutrition/iranianFoodsDatabase";
import { internationalFoodsDatabase } from "@/data/nutrition/internationalFoodsDatabase";
import { gymFoodsDatabase } from "@/data/nutrition/gymFoodsDatabase";
import { supplementsDatabase } from "@/data/nutrition/supplementsDatabase";
import { searchExternalFoods } from "@/lib/openFoodFactsApi";

const MIN_LOCAL_RESULTS_BEFORE_EXTERNAL_LOOKUP = 5;

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
function matchesWordPrefix(name: string, query: string): boolean {
  return name
    .split(/\s+/)
    .some((word) => word.replace(/^[^\p{L}\p{N}]+/u, "").startsWith(query));
}

function searchLocal(query: string): FoodItem[] {
  const qFa = normalizeFa(query);
  const qEn = query.trim().toLowerCase();

  if (!qFa) return [];

  return localFoods.filter(
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
