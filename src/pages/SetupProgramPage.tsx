import { useState } from "react";

import MeshGradientBackground from "@/components/background/MeshGradientBackground";
import AuthIntroSlider from "@/components/AuthIntroSlider";
import ChromaKeyVideo from "@/components/ChromaKeyVideo";
import InstallHint from "@/components/InstallHint";

import {
  getCurrentUserName,
  hasLegacyData,
  migrateLegacyDataTo,
  setCurrentUsername,
  setCurrentUserName,
} from "@/utils/userEngine";
import { isSyncConfigured } from "@/lib/supabaseClient";
import { MIN_PIN_LENGTH, signIn, signUp } from "@/auth/authEngine";
import { syncAfterLogin } from "@/sync/remoteSync";

// Username must be English only (letters, digits, and . _ - separators).
const USERNAME_PATTERN = /^[A-Za-z0-9._-]+$/;

function SetupBrand() {
  return (
    <div className="flex flex-col items-center text-center">
      <ChromaKeyVideo src="/Gampetoo.webm" size={96} className="mb-4" />

      <h1 className="text-3xl font-bold text-white">
        Gampetoo
      </h1>
    </div>
  );
}

// Login/signup only — picking workout days now happens on the home page's
// "select a program" card (once logged in) instead of blocking entry here,
// so this page's only job is getting a username set.
export default function SetupProgramPage() {
  const syncEnabled = isSyncConfigured();

  // Without a configured server there are no accounts to check credentials
  // against, so skip straight to the (password-less) signup form — same as
  // this screen's original behaviour in that mode.
  const [mode, setMode] = useState<"choose" | "login" | "signup">(
    () => (syncEnabled ? "choose" : "signup")
  );

  const [name, setName] = useState(
    () => getCurrentUserName() ?? ""
  );

  const [username, setUsername] = useState("");
  const [pin, setPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function goToMode(next: "choose" | "login" | "signup") {
    setMode(next);
    setError(null);
  }

  async function afterAuthSuccess(trimmedUsername: string) {
    if (syncEnabled) {
      // On a brand-new remote account this uploads the (now-migrated) local
      // data as the initial snapshot; on a returning account logging in from
      // a fresh device, this pulls its existing data (including the display
      // name) down instead.
      await syncAfterLogin(trimmedUsername);
    }

    setBusy(false);

    window.location.replace("/");
  }

  async function submitLogin() {
    setError(null);

    const trimmedUsername = username.trim();

    if (!trimmedUsername) return;

    setBusy(true);

    const result = await signIn(trimmedUsername, pin);

    if (!result.ok) {
      setBusy(false);
      setError(result.error ?? "ورود ناموفق بود.");
      return;
    }

    setCurrentUsername(trimmedUsername);
    await afterAuthSuccess(trimmedUsername);
  }

  async function submitSignup() {
    setError(null);

    const trimmedName = name.trim();
    const trimmedUsername = username.trim();

    if (!trimmedName || !trimmedUsername) return;

    if (!USERNAME_PATTERN.test(trimmedUsername)) {
      setError("نام کاربری باید فقط با حروف و اعداد انگلیسی باشد.");
      return;
    }

    if (syncEnabled && pin !== confirmPin) {
      setError("تکرار رمز مطابقت ندارد.");
      return;
    }

    setBusy(true);

    if (syncEnabled) {
      const result = await signUp(trimmedUsername, pin);

      if (!result.ok) {
        setBusy(false);
        setError(result.error ?? "ثبت‌نام ناموفق بود.");
        return;
      }
    }

    // Existing users from the old name-scoped scheme carry their data over to
    // the username they pick here. This must happen BEFORE syncAfterLogin
    // below — otherwise a brand-new remote account would bootstrap-push an
    // empty snapshot (nothing exists yet under the new username-scoped keys)
    // moments before the migrated data lands, and the page navigates away
    // before that data ever gets uploaded.
    const wasLegacy = hasLegacyData();

    setCurrentUsername(trimmedUsername);

    if (wasLegacy) {
      migrateLegacyDataTo(trimmedUsername);
    }

    setCurrentUserName(trimmedName);

    await afterAuthSuccess(trimmedUsername);
  }

  const canSubmitLogin =
    !busy && username.trim().length > 0 && pin.length >= MIN_PIN_LENGTH;

  const canSubmitSignup =
    !busy &&
    name.trim().length > 0 &&
    username.trim().length > 0 &&
    (!syncEnabled ||
      (pin.length >= MIN_PIN_LENGTH && confirmPin.length > 0));

  // The landing state is its own layout, not a variant of the form card:
  // brand pinned to the top, the tour filling the middle, and the two
  // choices sitting on the bottom edge where a thumb already is. The form
  // states below stay centred, since a keyboard is about to cover the lower
  // half of the screen.
  if (mode === "choose") {
    return (
      <div className="app-gradient-bg pt-safe relative flex min-h-screen flex-col px-6 pb-safe">
        <MeshGradientBackground />

        <div className="relative z-10 mx-auto flex w-full max-w-xl flex-1 flex-col py-8">
          <InstallHint />

          <div className="mt-4">
            <SetupBrand />
          </div>

          <div className="flex flex-1 items-center justify-center py-8">
            <AuthIntroSlider />
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => goToMode("login")}
              className="w-full glass-action flex-1 rounded-2xl py-4 text-xl font-bold text-white"
            >
              ورود
            </button>

            <button
              onClick={() => goToMode("signup")}
              className="selector-pill glass-tap flex-1 rounded-2xl py-4 text-xl font-bold text-white"
            >
              ثبت نام
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="app-gradient-bg pt-safe relative flex min-h-screen flex-col items-center justify-center px-6 py-10">
      <MeshGradientBackground />

      <div className="relative z-10 mx-auto flex w-full max-w-xl flex-col space-y-8">
        <InstallHint />

        <SetupBrand />

        <div className="glass-panel rounded-2xl p-6 space-y-4 text-center">
          {mode === "login" && (
            <>
              <input
                type="text"
                value={username}
                onChange={(e) => {
                  // Strip anything that isn't English so the username stays valid.
                  setUsername(e.target.value.replace(/[^A-Za-z0-9._-]/g, ""));
                  setError(null);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") void submitLogin();
                }}
                placeholder="نام کاربری خودت رو وارد کن"
                dir="ltr"
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck={false}
                className="glass-chip w-full rounded-xl p-4 text-center text-white"
              />

              <input
                type="password"
                inputMode="numeric"
                value={pin}
                onChange={(e) => {
                  setPin(e.target.value);
                  setError(null);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") void submitLogin();
                }}
                placeholder="رمز عبورت رو وارد کن"
                dir="ltr"
                className="glass-chip w-full rounded-xl p-4 text-center text-white"
              />

              {error && (
                <p className="text-sm text-white">
                  {error}
                </p>
              )}

              <button
                onClick={() => void submitLogin()}
                disabled={!canSubmitLogin}
                className="w-full glass-action rounded-2xl py-4 text-xl font-bold text-white disabled:cursor-not-allowed disabled:opacity-40"
              >
                {busy ? "..." : "ورود"}
              </button>

              <button
                onClick={() => goToMode("choose")}
                disabled={busy}
                className="w-full text-sm text-white underline disabled:cursor-not-allowed disabled:opacity-40"
              >
                بازگشت
              </button>
            </>
          )}

          {mode === "signup" && (
            <>
              <input
                type="text"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  setError(null);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") void submitSignup();
                }}
                placeholder="اسم خودت رو وارد کن"
                className="glass-chip w-full rounded-xl p-4 text-center text-white"
              />

              <input
                type="text"
                value={username}
                onChange={(e) => {
                  setUsername(e.target.value.replace(/[^A-Za-z0-9._-]/g, ""));
                  setError(null);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") void submitSignup();
                }}
                placeholder="نام کاربری خودت رو وارد کن"
                dir="ltr"
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck={false}
                className="glass-chip w-full rounded-xl p-4 text-center text-white"
              />

              {syncEnabled && (
                <>
                  <input
                    type="password"
                    inputMode="numeric"
                    value={pin}
                    onChange={(e) => {
                      setPin(e.target.value);
                      setError(null);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") void submitSignup();
                    }}
                    placeholder={`رمز خودت رو وارد کن (حداقل ${MIN_PIN_LENGTH} کاراکتر)`}
                    dir="ltr"
                    className="glass-chip w-full rounded-xl p-4 text-center text-white"
                  />

                  <input
                    type="password"
                    inputMode="numeric"
                    value={confirmPin}
                    onChange={(e) => {
                      setConfirmPin(e.target.value);
                      setError(null);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") void submitSignup();
                    }}
                    placeholder="تکرار رمز عبور"
                    dir="ltr"
                    className="glass-chip w-full rounded-xl p-4 text-center text-white"
                  />
                </>
              )}

              {error && (
                <p className="text-sm text-white">
                  {error}
                </p>
              )}

              <button
                onClick={() => void submitSignup()}
                disabled={!canSubmitSignup}
                className="w-full glass-action rounded-2xl py-4 text-xl font-bold text-white disabled:cursor-not-allowed disabled:opacity-40"
              >
                {busy ? "..." : "ثبت نام"}
              </button>

              {syncEnabled && (
                <button
                  onClick={() => goToMode("choose")}
                  disabled={busy}
                  className="w-full text-sm text-white underline disabled:cursor-not-allowed disabled:opacity-40"
                >
                  بازگشت
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
