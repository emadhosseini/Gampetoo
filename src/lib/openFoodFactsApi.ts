import type { FoodCategory, FoodItem } from "@/types/food";

const SEARCH_URL = "https://world.openfoodfacts.org/cgi/search.pl";
const REQUEST_TIMEOUT_MS = 6000;

interface OffProduct {
  code?: string;
  product_name?: string;
  product_name_en?: string;
  generic_name?: string;
  categories_tags?: string[];
  nutriments?: {
    "energy-kcal_100g"?: number;
    proteins_100g?: number;
    carbohydrates_100g?: number;
    fat_100g?: number;
    fiber_100g?: number;
  };
}

interface OffSearchResponse {
  products?: OffProduct[];
}

function guessCategory(tags: string[] | undefined): FoodCategory {
  const joined = (tags ?? []).join(" ").toLowerCase();

  if (/dairy|milk|yogurt|cheese/.test(joined)) return "dairy";
  if (/bread|cereal|grain|pasta|rice/.test(joined)) return "bread_grain";
  if (/meat|poultry|fish|egg|seafood/.test(joined)) return "protein";
  if (/snack|sweet|nut|chip|biscuit|candy/.test(joined)) return "snack";

  return "main_dish";
}

function mapProduct(product: OffProduct): FoodItem | null {
  const nameEn =
    product.product_name_en || product.product_name || product.generic_name;

  if (!nameEn || !product.code) return null;

  const n = product.nutriments ?? {};
  const calories = n["energy-kcal_100g"];

  // No usable nutrition data for this product — not worth surfacing.
  if (calories === undefined) return null;

  return {
    id: `off-${product.code}`,
    // Open Food Facts has no reliable Persian name field — falling back to
    // the English name for both keeps the entry searchable either way.
    nameFa: nameEn,
    nameEn,
    category: guessCategory(product.categories_tags),
    servingUnit: "100 گرم",
    servingWeightGrams: 100,
    calories: Math.round(calories),
    proteinGrams: Math.round((n.proteins_100g ?? 0) * 10) / 10,
    carbsGrams: Math.round((n.carbohydrates_100g ?? 0) * 10) / 10,
    fatGrams: Math.round((n.fat_100g ?? 0) * 10) / 10,
    fiberGrams:
      n.fiber_100g !== undefined ? Math.round(n.fiber_100g * 10) / 10 : undefined,
  };
}

/**
 * Looks up an external/international food by name via the Open Food Facts
 * API (no API key required, CORS-friendly for direct browser calls). Never
 * throws — offline, timeout, CORS, and malformed-response failures all
 * resolve to an empty array so callers can always fall back to local data.
 */
export async function searchExternalFoods(
  query: string,
  limit = 8,
): Promise<FoodItem[]> {
  const trimmed = query.trim();

  if (!trimmed) return [];

  const url = new URL(SEARCH_URL);
  url.searchParams.set("search_terms", trimmed);
  url.searchParams.set("search_simple", "1");
  url.searchParams.set("action", "process");
  url.searchParams.set("json", "1");
  url.searchParams.set("page_size", String(limit));
  url.searchParams.set("sort_by", "unique_scans_n");

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const res = await fetch(url.toString(), { signal: controller.signal });

    if (!res.ok) return [];

    const data: OffSearchResponse = await res.json();
    const products = data.products ?? [];

    const seen = new Set<string>();
    const results: FoodItem[] = [];

    for (const product of products) {
      const mapped = mapProduct(product);

      if (!mapped) continue;
      if (seen.has(mapped.nameEn.toLowerCase())) continue;

      seen.add(mapped.nameEn.toLowerCase());
      results.push(mapped);

      if (results.length >= limit) break;
    }

    return results;
  } catch {
    // Offline, aborted (timeout), CORS failure, malformed JSON, etc. — the
    // caller (searchFood) always has the local database to fall back to, so
    // a failed external lookup should never surface as an app error.
    return [];
  } finally {
    clearTimeout(timeout);
  }
}
