import { useState } from "react";
import { Share, SquarePlus, X } from "lucide-react";

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
    <div className="relative mx-auto w-full max-w-xl rounded-2xl border border-zinc-800 bg-zinc-900 p-4 text-center">
      <button
        onClick={dismiss}
        aria-label="بستن"
        className="absolute left-3 top-3 text-zinc-500 hover:text-zinc-300"
      >
        <X size={18} />
      </button>

      <p className="text-sm font-medium text-white">
        برای دسترسی راحت‌تر به برنامه
      </p>

      <p className="mt-2 text-sm leading-7 text-zinc-400">
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
    </div>
  );
}
