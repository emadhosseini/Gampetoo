import { useState } from "react";
import { Share, SquarePlus } from "lucide-react";

const DISMISS_KEY = "gampetoo-install-hint-dismissed";

function isStandalone() {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    // iOS Safari exposes this non-standard flag when launched from the home screen.
    (window.navigator as unknown as { standalone?: boolean }).standalone === true
  );
}

export default function InstallHint() {
  const [dismissed, setDismissed] = useState(() => {
    try {
      return localStorage.getItem(DISMISS_KEY) === "1";
    } catch {
      return false;
    }
  });

  // Already installed to the home screen — nothing to hint at.
  if (isStandalone() || dismissed) {
    return null;
  }

  function dismiss() {
    try {
      localStorage.setItem(DISMISS_KEY, "1");
    } catch {
      // Ignore storage failures — worst case the hint shows again next visit.
    }

    setDismissed(true);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-6 backdrop-blur-sm">
      <div className="w-full max-w-sm rounded-2xl border border-forest-600 bg-forest-700 p-6 text-center shadow-2xl">
        <p className="text-base font-bold text-white">
          برای دسترسی راحت‌تر به برنامه
        </p>

        <p className="mt-3 text-sm leading-8 text-white">
          روی دکمه
          <span className="mx-1 inline-flex items-center gap-1 align-middle font-medium text-white">
            <Share size={16} />
            Share
          </span>
          کلیک کرده و
          <span className="mx-1 inline-flex items-center gap-1 align-middle font-medium text-white">
            <SquarePlus size={16} />
            Add to Home Screen
          </span>
          را بزنید
        </p>

        <button
          onClick={dismiss}
          className="mt-6 w-full rounded-2xl bg-avocado-yellow py-3 text-lg font-bold text-black"
        >
          متوجه شدم
        </button>
      </div>
    </div>
  );
}
