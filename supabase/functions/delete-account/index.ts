// Supabase Edge Function (Deno). Deletes the calling account for good —
// its synced data row and its auth user, so the username is released and can
// be registered again.
//
// This can't live in the client: deleting an auth user requires the
// service-role key, which must never ship in the browser bundle. The client
// caller is src/auth/authEngine.ts's deleteAccountRemote(), which only ever
// sends its own session's JWT — the function derives *which* account to
// delete from that token, never from the request body, so one account can't
// ask for another to be deleted.
//
// Deploy: paste this file's contents into Supabase Dashboard -> Edge
// Functions -> New Function (name it exactly "delete-account") -> Deploy.
// No secrets to set: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are
// injected into every edge function automatically.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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
  const headers = { ...corsHeaders(req.headers.get("origin")), "Content-Type": "application/json" };

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders(req.headers.get("origin")) });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), { status: 405, headers });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY");

  if (!supabaseUrl || !serviceRoleKey || !anonKey) {
    return new Response(JSON.stringify({ error: "سرویس حذف حساب پیکربندی نشده." }), {
      status: 500,
      headers,
    });
  }

  const authHeader = req.headers.get("Authorization");

  if (!authHeader) {
    return new Response(JSON.stringify({ error: "برای حذف حساب باید وارد شده باشی." }), {
      status: 401,
      headers,
    });
  }

  // Resolve the caller from their own token first. Everything below acts on
  // this id and nothing else.
  const callerClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authHeader } },
  });

  const { data: userData, error: userError } = await callerClient.auth.getUser();
  const userId = userData?.user?.id;

  if (userError || !userId) {
    return new Response(JSON.stringify({ error: "نشست معتبر نیست. دوباره وارد شو." }), {
      status: 401,
      headers,
    });
  }

  const adminClient = createClient(supabaseUrl, serviceRoleKey);

  try {
    // user_data cascades on the auth user being deleted, but only if the
    // project actually has that foreign key — deleting it outright first
    // means the data is gone either way.
    const { error: dataError } = await adminClient.from("user_data").delete().eq("user_id", userId);

    if (dataError) throw dataError;

    // Hard delete (the second argument would make it a soft delete, which
    // keeps the email — and therefore the username — registered).
    const { error: deleteError } = await adminClient.auth.admin.deleteUser(userId);

    if (deleteError) throw deleteError;

    return new Response(JSON.stringify({ ok: true }), { status: 200, headers });
  } catch (error) {
    console.error("delete-account function error:", error);

    return new Response(JSON.stringify({ error: "حذف حساب روی سرور انجام نشد." }), {
      status: 500,
      headers,
    });
  }
});
