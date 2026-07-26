import { useState } from "react";

// The app moved from gampetoo.com to pwa.gampetoo.com — this old domain will
// be shut down soon, so anyone still landing on it (an old bookmark, an
// already-installed PWA icon, a stale link) needs to be told to switch.
const OLD_HOSTNAMES = ["gampetoo.com", "www.gampetoo.com"];
const NEW_URL = "https://pwa.gampetoo.com";

export default function DomainMigrationNotice() {
  const [dismissed, setDismissed] = useState(false);

  const onOldDomain = OLD_HOSTNAMES.includes(window.location.hostname);

  if (!onOldDomain || dismissed) {
    return null;
  }

  return (
    <div className="pt-safe fixed inset-0 z-[80] flex items-center justify-center bg-black/70 px-6 backdrop-blur-sm">
      <div className="w-full max-w-sm rounded-2xl border border-forest-600 bg-forest-700 p-6 text-center shadow-2xl">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-avocado-yellow/10 text-2xl">
          🚚
        </div>

        <h2 className="mt-4 text-lg font-bold text-white">
          آدرس اپ عوض شده
        </h2>

        <p className="mt-2 text-sm leading-7 text-white">
          گمپتو به آدرس جدید منتقل شده. لطفاً از این به بعد از{" "}
          <span dir="ltr" className="font-bold">
            pwa.gampetoo.com
          </span>{" "}
          استفاده کن — این آدرس قدیمی به‌زودی غیرفعال می‌شه.
        </p>

        <div className="mt-6 flex flex-col gap-3">
          <button
            onClick={() => {
              window.location.href = NEW_URL;
            }}
            className="w-full rounded-2xl bg-avocado-yellow py-3 font-bold text-black"
          >
            رفتن به آدرس جدید
          </button>

          <button
            onClick={() => setDismissed(true)}
            className="ghost-action w-full rounded-2xl py-3 font-medium text-white"
          >
            بعداً
          </button>
        </div>
      </div>
    </div>
  );
}
