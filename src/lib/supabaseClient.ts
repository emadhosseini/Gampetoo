import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Cloud sync is entirely optional infrastructure: without env vars configured,
// the app keeps working exactly as before (local-only), just without
// cross-device sync. Every caller must handle `supabase` being null.
export const supabase: SupabaseClient | null =
  url && anonKey ? createClient(url, anonKey) : null;

export function isSyncConfigured(): boolean {
  return supabase !== null;
}
