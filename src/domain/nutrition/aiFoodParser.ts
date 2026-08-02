import { supabase } from "@/lib/supabaseClient";

export interface AiExtractedFoodItem {
  name: string;
  quantity: number;
  unit: string;
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

  const items = (Array.isArray(data?.items) ? data.items : []).filter(isExtractedItem);

  if (items.length === 0) {
    return { ok: false, items: [], error: "چیزی از توضیحت استخراج نشد." };
  }

  return { ok: true, items };
}
