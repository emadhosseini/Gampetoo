// Supabase Edge Function (Deno). Proxies Gampetoo's "افزودن با هوش مصنوعی"
// meal-logging feature to the Gemini API so the API key never ships in the
// client bundle — this repo has no backend of its own otherwise, so this
// function is the one place a request can reach Gemini without exposing the
// key. The client caller is src/domain/nutrition/aiFoodParser.ts.
//
// Deploy: paste this file's contents into Supabase Dashboard -> Edge
// Functions -> New Function (name it exactly "parse-meal") -> Deploy.
// Then set the secret: Edge Functions -> parse-meal -> Secrets ->
// GEMINI_API_KEY, or via the CLI: `supabase secrets set GEMINI_API_KEY=...`.

const GEMINI_MODEL = "gemini-flash-lite-latest";
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

// Every item also carries a rough nutrition estimate now (unitGrams +
// per-100g macros), even though the app prefers its own local/external
// database lookups over these — see aiFoodMatching.ts's findBestFoodMatch.
// These numbers are only ever used as the last-resort fallback when a food
// isn't found anywhere else, and the client always labels that case as an
// estimate rather than a real database value.
const SYSTEM_PROMPT = `شما یک استخراج‌کننده‌ی اطلاعات تغذیه‌ای برای یک اپلیکیشن فارسی‌زبان هستید. کاربر وعده‌ی غذایی خودش رو به فارسی وارد می‌کنه (مثلاً «یک بشقاب قرمه سبزی و دو کفگیر برنج»). برای هر آیتم غذایی، اسم، مقدار، واحد شمارش، و یک تخمین تغذیه‌ای (بر اساس دانش عمومی‌ات از غذاهای ایرانی و بین‌المللی) رو استخراج کن و فقط یک آرایه‌ی JSON با این ساختار برگردون:
[{ "name": string, "quantity": number, "unit": string, "unitGrams": number, "caloriesPer100g": number, "proteinPer100g": number, "carbsPer100g": number, "fatPer100g": number }]
- unitGrams: وزن تقریبی به گرم برای یک واحد از "unit" همین غذا (مثلاً یک قاشق غذاخوری برنج پخته تقریباً ۲۰ گرمه)
- caloriesPer100g / proteinPer100g / carbsPer100g / fatPer100g: مقادیر تغذیه‌ای تقریبی به‌ازای ۱۰۰ گرم از خودِ غذا (نه کل وعده)
هیچ متن، توضیح یا بلاک markdown دیگه‌ای برنگردون — فقط خود آرایه‌ی JSON.`;

const ALLOWED_ORIGINS = new Set([
  "https://pwa.gampetoo.com",
  "https://dev.gampetoo.com",
  "http://localhost:5173",
]);

function corsHeaders(origin: string | null) {
  const allowOrigin = origin && ALLOWED_ORIGINS.has(origin) ? origin : "https://pwa.gampetoo.com";
  return {
    "Access-Control-Allow-Origin": allowOrigin,
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
  };
}

Deno.serve(async (req: Request) => {
  const corsResponseHeaders = corsHeaders(req.headers.get("origin"));

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsResponseHeaders });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsResponseHeaders, "Content-Type": "application/json" },
    });
  }

  const apiKey = Deno.env.get("GEMINI_API_KEY");
  if (!apiKey) {
    return new Response(JSON.stringify({ error: "GEMINI_API_KEY تنظیم نشده." }), {
      status: 500,
      headers: { ...corsResponseHeaders, "Content-Type": "application/json" },
    });
  }

  let text: string;
  try {
    const body = await req.json();
    text = typeof body?.text === "string" ? body.text.trim() : "";
  } catch {
    return new Response(JSON.stringify({ error: "بدنه‌ی درخواست نامعتبره." }), {
      status: 400,
      headers: { ...corsResponseHeaders, "Content-Type": "application/json" },
    });
  }

  if (!text) {
    return new Response(JSON.stringify({ error: "متنی وارد نشده." }), {
      status: 400,
      headers: { ...corsResponseHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const geminiResponse = await fetch(`${GEMINI_URL}?key=${apiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text }] }],
        systemInstruction: { role: "system", parts: [{ text: SYSTEM_PROMPT }] },
        generationConfig: { response_mime_type: "application/json", temperature: 0.2 },
      }),
    });

    if (!geminiResponse.ok) {
      const errBody = await geminiResponse.text();
      console.error("Gemini API error:", geminiResponse.status, errBody);
      return new Response(JSON.stringify({ error: "خطا در ارتباط با سرویس هوش مصنوعی." }), {
        status: 502,
        headers: { ...corsResponseHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await geminiResponse.json();
    const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (typeof rawText !== "string") {
      return new Response(JSON.stringify({ error: "پاسخ نامعتبر از سرویس هوش مصنوعی." }), {
        status: 502,
        headers: { ...corsResponseHeaders, "Content-Type": "application/json" },
      });
    }

    let items: unknown;
    try {
      items = JSON.parse(rawText);
    } catch {
      return new Response(JSON.stringify({ error: "پاسخ هوش مصنوعی قابل تفسیر نبود." }), {
        status: 502,
        headers: { ...corsResponseHeaders, "Content-Type": "application/json" },
      });
    }

    if (!Array.isArray(items)) {
      return new Response(JSON.stringify({ error: "پاسخ هوش مصنوعی قابل تفسیر نبود." }), {
        status: 502,
        headers: { ...corsResponseHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ items }), {
      status: 200,
      headers: { ...corsResponseHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("parse-meal function error:", error);
    return new Response(JSON.stringify({ error: "خطای غیرمنتظره رخ داد." }), {
      status: 500,
      headers: { ...corsResponseHeaders, "Content-Type": "application/json" },
    });
  }
});
