import { useEffect, useState } from "react";

import { hasStartDate } from "@/utils/programEngine";
import { getCurrentUsername, hasCurrentUsername } from "@/utils/userEngine";
import { isSyncConfigured } from "@/lib/supabaseClient";
import { getRemoteUserId, MIN_PIN_LENGTH, signInOrSignUp } from "@/auth/authEngine";
import { syncAfterLogin } from "@/sync/remoteSync";

// Prompts an existing local-only account (created before server sync existed)
// to set a password, so its already-there data gets backed up to the server
// under the SAME username — no migration, no data change, just adding a
// password on top of an account that already exists. App.tsx's routing gate
// skips /setup entirely once hasCurrentUsername() && hasStartDate() are both
// true, so this is the only place these accounts would ever see this offer.
export default function SetPasswordPrompt() {
  const [checked, setChecked] = useState(false);
  const [needsPassword, setNeedsPassword] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [success, setSuccess] = useState(false);

  const [pin, setPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function check() {
      if (!isSyncConfigured() || !hasCurrentUsername() || !hasStartDate()) {
        if (!cancelled) setChecked(true);
        return;
      }

      const userId = await getRemoteUserId();

      if (!cancelled) {
        setNeedsPassword(userId === null);
        setChecked(true);
      }
    }

    void check();

    return () => {
      cancelled = true;
    };
  }, []);

  async function submit() {
    setError(null);

    if (pin.length < MIN_PIN_LENGTH) {
      setError(`رمز باید حداقل ${MIN_PIN_LENGTH} کاراکتر باشد.`);
      return;
    }

    if (pin !== confirmPin) {
      setError("تکرار رمز مطابقت ندارد.");
      return;
    }

    const username = getCurrentUsername();
    if (!username) return;

    setBusy(true);

    const result = await signInOrSignUp(username, pin);

    if (!result.ok) {
      setBusy(false);
      setError(result.error ?? "ثبت رمز ناموفق بود.");
      return;
    }

    // Bootstraps this account's EXISTING local data as its first server
    // snapshot — same username, nothing about it changes locally.
    await syncAfterLogin(username);

    setBusy(false);
    setSuccess(true);
  }

  if (!checked || !needsPassword || dismissed) {
    return null;
  }

  if (success) {
    return (
      <div className="pt-safe fixed inset-0 z-[65] flex items-center justify-center bg-black/70 px-6 backdrop-blur-sm">
        <div className="w-full max-w-sm rounded-2xl border border-forest-600 bg-forest-700 p-6 text-center shadow-2xl">
          <p className="text-lg font-bold text-white">
            رمز عبورت با موفقیت تنظیم شد ✅
          </p>

          <p className="mt-2 text-sm leading-7 text-zinc-200">
            اطلاعاتت الان روی سرور هم ذخیره شده و از هر دستگاهی با همین نام
            کاربری در دسترسته.
          </p>

          <button
            onClick={() => setDismissed(true)}
            className="mt-6 w-full rounded-2xl bg-avocado-yellow py-3 text-lg font-bold text-black"
          >
            باشه
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="pt-safe fixed inset-0 z-[65] flex items-center justify-center bg-black/70 px-6 backdrop-blur-sm">
      <div className="w-full max-w-sm rounded-2xl border border-forest-600 bg-forest-700 p-6 text-center shadow-2xl">
        <p className="text-lg font-bold text-white">
          رمز عبور تنظیم کن
        </p>

        <p className="mt-2 text-sm leading-7 text-zinc-200">
          با تنظیم یک رمز عبور، اطلاعات فعلیت بدون هیچ تغییری روی سرور
          ذخیره می‌شه و می‌تونی با همین نام کاربری از هر دستگاه دیگه‌ای هم
          بهش دسترسی داشته باشی.
        </p>

        <div className="mt-4 space-y-3">
          <input
            type="password"
            value={pin}
            onChange={(e) => setPin(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") void submit();
            }}
            placeholder={`رمز عبور (حداقل ${MIN_PIN_LENGTH} کاراکتر)`}
            dir="ltr"
            className="w-full rounded-xl border border-forest-500 bg-forest-600 p-4 text-center text-white"
          />

          <input
            type="password"
            value={confirmPin}
            onChange={(e) => setConfirmPin(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") void submit();
            }}
            placeholder="تکرار رمز عبور"
            dir="ltr"
            className="w-full rounded-xl border border-forest-500 bg-forest-600 p-4 text-center text-white"
          />
        </div>

        {error && (
          <p className="mt-3 text-sm text-red-200">
            {error}
          </p>
        )}

        <div className="mt-6 flex gap-3">
          <button
            onClick={() => setDismissed(true)}
            disabled={busy}
            className="flex-1 rounded-2xl bg-forest-600 py-3 font-bold text-white disabled:cursor-not-allowed disabled:opacity-40"
          >
            بعداً
          </button>

          <button
            onClick={() => void submit()}
            disabled={busy || pin.length < MIN_PIN_LENGTH}
            className="flex-1 rounded-2xl bg-avocado-yellow py-3 font-bold text-black disabled:cursor-not-allowed disabled:opacity-40"
          >
            {busy ? "..." : "تنظیم رمز"}
          </button>
        </div>
      </div>
    </div>
  );
}
