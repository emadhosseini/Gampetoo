import { supabase } from "@/lib/supabaseClient";

// Supabase Auth is email/password-based; usernames are mapped onto a
// synthetic address so users never see or need a real email. This still gets
// us Supabase's server-side password hashing, rate-limiting, and JWTs (which
// Row Level Security relies on) for free, instead of rolling our own.
const EMAIL_DOMAIN = "gampetoo.local";

export const MIN_PIN_LENGTH = 6;

function usernameToEmail(username: string): string {
  return `${username.toLowerCase()}@${EMAIL_DOMAIN}`;
}

export interface AuthResult {
  ok: boolean;
  error?: string;
}

/**
 * Logs into an existing account, or creates one if the username doesn't
 * exist yet — a unified login/signup flow so the setup screen doesn't need
 * to ask which one the user means.
 */
export async function signInOrSignUp(
  username: string,
  pin: string
): Promise<AuthResult> {
  if (!supabase) {
    return { ok: false, error: "همگام‌سازی با سرور فعال نیست." };
  }

  if (pin.length < MIN_PIN_LENGTH) {
    return {
      ok: false,
      error: `رمز باید حداقل ${MIN_PIN_LENGTH} کاراکتر باشد.`,
    };
  }

  const email = usernameToEmail(username);

  const signInResult = await supabase.auth.signInWithPassword({
    email,
    password: pin,
  });

  if (!signInResult.error) {
    return { ok: true };
  }

  const signUpResult = await supabase.auth.signUp({
    email,
    password: pin,
  });

  if (!signUpResult.error) {
    return { ok: true };
  }

  // The account exists (that's why sign-up also failed) — the original
  // sign-in failure was a wrong PIN, not a missing account.
  if (signUpResult.error.message.toLowerCase().includes("already registered")) {
    return { ok: false, error: "نام کاربری یا رمز اشتباه است." };
  }

  return { ok: false, error: signUpResult.error.message };
}

export async function signOutRemote(): Promise<void> {
  await supabase?.auth.signOut();
}

/** The Supabase auth user id for the active session, or null if signed out
 * or sync isn't configured. Used by the sync engine to address the
 * user_data row — RLS still enforces this server-side regardless. */
export async function getRemoteUserId(): Promise<string | null> {
  if (!supabase) return null;

  const { data } = await supabase.auth.getSession();

  return data.session?.user.id ?? null;
}
