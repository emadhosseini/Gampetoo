import { supabase } from "@/lib/supabaseClient";

export interface AiExtractedFoodItem {
  name: string;
  quantity: number;
  unit: string;
  // Gemini's own rough nutrition guess for this food — only present when
  // every field parsed as a real number. Used strictly as a last-resort
  // fallback (see aiFoodMatching.ts) when neither the local nor the
  // external database has this food; never trusted over a real match.
  unitGrams?: number;
  caloriesPer100g?: number;
  proteinPer100g?: number;
  carbsPer100g?: number;
  fatPer100g?: number;
}

export interface AiParseResult {
  ok: boolean;
  items: AiExtractedFoodItem[];
  error?: string;
}

interface ParseMealResponse {
  items?: unknown;
  error?: string;
}

function isExtractedItem(value: unknown): value is AiExtractedFoodItem {
  if (typeof value !== "object" || value === null) return false;

  const item = value as Record<string, unknown>;

  return (
    typeof item.name === "string" &&
    typeof item.quantity === "number" &&
    typeof item.unit === "string"
  );
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

// The estimate fields are optional and only trusted if every single one
// parsed as a real number — a partial guess (e.g. calories but no protein)
// isn't useful, since buildEstimatedFood (aiFoodMatching.ts) needs all four
// macros plus unitGrams to construct a usable fallback FoodItem.
function normalizeEstimate(item: AiExtractedFoodItem): AiExtractedFoodItem {
  const raw = item as unknown as Record<string, unknown>;

  const fields = [
    raw.unitGrams,
    raw.caloriesPer100g,
    raw.proteinPer100g,
    raw.carbsPer100g,
    raw.fatPer100g,
  ];

  if (!fields.every(isFiniteNumber)) {
    return { name: item.name, quantity: item.quantity, unit: item.unit };
  }

  const [unitGrams, caloriesPer100g, proteinPer100g, carbsPer100g, fatPer100g] =
    fields as number[];

  return {
    name: item.name,
    quantity: item.quantity,
    unit: item.unit,
    unitGrams,
    caloriesPer100g,
    proteinPer100g,
    carbsPer100g,
    fatPer100g,
  };
}

// Calls the parse-meal Supabase Edge Function, which holds the Gemini API
// key server-side (as a Supabase secret — see
// supabase/functions/parse-meal/index.ts). The client never sees the key;
// this app has no backend of its own otherwise, so the edge function is the
// one place a request can reach a paid API without shipping the key in the
// public bundle.
export async function parseMealDescription(text: string): Promise<AiParseResult> {
  const trimmed = text.trim();

  if (!trimmed) {
    return { ok: false, items: [], error: "متنی وارد نشده." };
  }

  if (!supabase) {
    return {
      ok: false,
      items: [],
      error: "این قابلیت نیاز به فعال بودن همگام‌سازی ابری داره.",
    };
  }

  const { data, error } = await supabase.functions.invoke<ParseMealResponse>(
    "parse-meal",
    { body: { text: trimmed } },
  );

  if (error) {
    return { ok: false, items: [], error: "ارتباط با سرویس هوش مصنوعی برقرار نشد." };
  }

  if (data?.error) {
    return { ok: false, items: [], error: data.error };
  }

  const items = (Array.isArray(data?.items) ? data.items : [])
    .filter(isExtractedItem)
    .map(normalizeEstimate);

  if (items.length === 0) {
    return { ok: false, items: [], error: "چیزی از توضیحت استخراج نشد." };
  }

  return { ok: true, items };
}
