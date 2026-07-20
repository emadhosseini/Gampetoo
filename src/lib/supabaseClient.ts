import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Definitive runtime proof of what THIS deployed bundle was built with —
// open the browser console on the live site and look for this line.
console.log(
  "[runtime-check] VITE_SUPABASE_URL =",
  JSON.stringify(url),
  "| VITE_SUPABASE_ANON_KEY =",
  anonKey ? `${anonKey.slice(0, 12)}…(set)` : "undefined"
);

// Cloud sync is entirely optional infrastructure: without env vars configured,
// the app keeps working exactly as before (local-only), just without
// cross-device sync. Every caller must handle `supabase` being null.
export const supabase: SupabaseClient | null =
  url && anonKey ? createClient(url, anonKey) : null;

export function isSyncConfigured(): boolean {
  return supabase !== null;
}
