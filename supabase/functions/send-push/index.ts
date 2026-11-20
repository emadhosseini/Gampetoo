// Supabase Edge Function (Deno). Sends Apple Push Notifications (APNs) to a
// user's registered iOS devices stored in `public.device_push_tokens`.
//
// Two supported caller modes:
//   1. Admin / Cron mode: send header `x-push-secret: <PUSH_ADMIN_SECRET>` with
//      `{ userId?, title, body, data? }` to push to one user or all iOS devices.
//   2. Self-test mode (from the iOS app's Settings): send the user's normal
//      Supabase JWT (`Authorization: Bearer ...`) with `{ selfTest: true }` to
//      verify APNs delivery end-to-end on the caller's own device(s) only.
//
// Required Supabase Edge Function Secrets:
//   APNS_TEAM_ID      - 10-char Apple Developer Team ID (e.g. YZ37YD3BVG)
//   APNS_KEY_ID       - 10-char APNs Auth Key ID (.p8 key from Apple Developer)
//   APNS_PRIVATE_KEY  - Contents of AuthKey_XXXXXXXXXX.p8 (PKCS#8 PEM)
//   APNS_BUNDLE_ID    - iOS Bundle ID (com.gampetoo.app)
//   APNS_ENVIRONMENT  - "production" (TestFlight/App Store) or "sandbox" (Xcode debug)
//   PUSH_ADMIN_SECRET - Shared secret header (`x-push-secret`) for server/cron callers

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const ALLOWED_ORIGINS = new Set([
  "https://pwa.gampetoo.com",
  "https://dev.gampetoo.com",
  "http://localhost:5173",
  "capacitor://localhost",
]);

function corsHeaders(origin: string | null) {
  const allowOrigin = origin && ALLOWED_ORIGINS.has(origin) ? origin : "https://pwa.gampetoo.com";
  return {
    "Access-Control-Allow-Origin": allowOrigin,
    "Access-Control-Allow-Headers":
      "authorization, x-client-info, apikey, content-type, x-push-secret",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
  };
}

function base64UrlEncode(input: Uint8Array | string): string {
  const bytes = typeof input === "string" ? new TextEncoder().encode(input) : input;
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function pemToArrayBuffer(pem: string): ArrayBuffer {
  const cleaned = pem
    .replace(/-----BEGIN PRIVATE KEY-----/g, "")
    .replace(/-----END PRIVATE KEY-----/g, "")
    .replace(/\\n/g, "")
    .replace(/\s+/g, "");
  const binary = atob(cleaned);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

async function createApnsJwt(teamId: string, keyId: string, privateKeyPem: string): Promise<string> {
  const header = base64UrlEncode(JSON.stringify({ alg: "ES256", kid: keyId }));
  const payload = base64UrlEncode(
    JSON.stringify({ iss: teamId, iat: Math.floor(Date.now() / 1000) }),
  );
  const signingInput = `${header}.${payload}`;

  const cryptoKey = await crypto.subtle.importKey(
    "pkcs8",
    pemToArrayBuffer(privateKeyPem),
    { name: "ECDSA", namedCurve: "P-256" },
    false,
    ["sign"],
  );

  const signature = await crypto.subtle.sign(
    { name: "ECDSA", hash: "SHA-256" },
    cryptoKey,
    new TextEncoder().encode(signingInput),
  );

  return `${signingInput}.${base64UrlEncode(new Uint8Array(signature))}`;
}

Deno.serve(async (req: Request) => {
  const headers = {
    ...corsHeaders(req.headers.get("origin")),
    "Content-Type": "application/json",
  };

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders(req.headers.get("origin")) });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers,
    });
  }

  const teamId = Deno.env.get("APNS_TEAM_ID");
  const keyId = Deno.env.get("APNS_KEY_ID");
  const privateKey = Deno.env.get("APNS_PRIVATE_KEY");
  const bundleId = Deno.env.get("APNS_BUNDLE_ID") ?? "com.gampetoo.app";
  const env = Deno.env.get("APNS_ENVIRONMENT") ?? "production";
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
  const adminSecret = Deno.env.get("PUSH_ADMIN_SECRET");

  if (!teamId || !keyId || !privateKey || !supabaseUrl || !serviceRoleKey) {
    return new Response(JSON.stringify({ error: "تنظیمات APNs روی سرور کامل نیست." }), {
      status: 500,
      headers,
    });
  }

  const body = (await req.json().catch(() => ({}))) as {
    selfTest?: boolean;
    userId?: string;
    title?: string;
    body?: string;
    data?: Record<string, unknown>;
  };

  const isAdmin = Boolean(adminSecret && req.headers.get("x-push-secret") === adminSecret);
  let targetUserId = body.userId;
  let title = body.title;
  let message = body.body;

  if (!isAdmin) {
    if (!body.selfTest || !anonKey) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers,
      });
    }

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "برای تست پوش باید وارد حساب شده باشی." }), {
        status: 401,
        headers,
      });
    }

    const callerClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userData, error: userError } = await callerClient.auth.getUser();
    const callerId = userData?.user?.id;

    if (userError || !callerId) {
      return new Response(JSON.stringify({ error: "نشست معتبر نیست." }), {
        status: 401,
        headers,
      });
    }

    targetUserId = callerId;
    title = "تست پوش گمپتو 🔔";
    message = "اتصال پوش نوتیفیکیشن سروری (APNs) با موفقیت کار می‌کند!";
  }

  if (!title || !message) {
    return new Response(JSON.stringify({ error: "title and body are required." }), {
      status: 400,
      headers,
    });
  }

  const adminClient = createClient(supabaseUrl, serviceRoleKey);
  let query = adminClient.from("device_push_tokens").select("token").eq("platform", "ios");
  if (targetUserId) {
    query = query.eq("user_id", targetUserId);
  }

  const { data: rows, error } = await query;
  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers,
    });
  }

  if (!rows || rows.length === 0) {
    return new Response(
      JSON.stringify({ error: "هیچ توکن iOS برای این حساب روی سرور ثبت نشده است." }),
      { status: 404, headers },
    );
  }

  const jwt = await createApnsJwt(teamId, keyId, privateKey);
  const apnsHost =
    env === "sandbox" ? "https://api.sandbox.push.apple.com" : "https://api.push.apple.com";

  const results = await Promise.all(
    rows.map(async ({ token }) => {
      const res = await fetch(`${apnsHost}/3/device/${token}`, {
        method: "POST",
        headers: {
          authorization: `bearer ${jwt}`,
          "apns-topic": bundleId,
          "apns-push-type": "alert",
          "apns-priority": "10",
          "content-type": "application/json",
        },
        body: JSON.stringify({
          aps: {
            alert: { title, body: message },
            sound: "default",
          },
          ...(body.data ?? {}),
        }),
      });

      const detail = res.ok ? undefined : await res.text().catch(() => undefined);
      return { token: token.slice(0, 8), status: res.status, detail };
    }),
  );

  const succeeded = results.filter((r) => r.status === 200).length;
  return new Response(JSON.stringify({ sent: succeeded, total: results.length, results }), {
    status: succeeded > 0 ? 200 : 502,
    headers,
  });
});
