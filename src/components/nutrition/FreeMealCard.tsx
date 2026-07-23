import { useState } from "react";

import { getFreeMealStatus, markFreeMealUsed } from "@/utils/freeMealEngine";
import { toFaDigits } from "@/utils/numberFormat";

function usedTodayMessage(weeklyCount: number): string {
  return weeklyCount > 1
    ? "امروز یکی از وعده‌های آزاد هفته رو خوردی"
    : "وعده آزاد هفته رو امروز خوردی";
}

export default function FreeMealCard() {
  const [status, setStatus] = useState(() => getFreeMealStatus());
  // Tracks "did I just mark one used during this visit" separately from
  // "is the weekly allowance at zero" — the two need to be told apart so a
  // single-free-meal account still gets its today-specific confirmation
  // instead of jumping straight to the plain exhausted message.
  const [justUsed, setJustUsed] = useState(false);

  function handleClick() {
    const confirmed = window.confirm(
      status.remaining <= 1
        ? "در صورت تایید، وعده‌های آزاد این هفته‌ات تموم می‌شه"
        : "ثبت بشه که وعده آزادت رو امروز خوردی؟",
    );

    if (!confirmed) return;

    markFreeMealUsed();
    setStatus(getFreeMealStatus());
    setJustUsed(true);
  }

  const exhausted = status.remaining === 0;

  // A return visit after the allowance was already used up on a previous
  // day — nothing "just happened" to report, so just the plain status.
  if (exhausted && !justUsed) {
    return (
      <div className="glass-tap rounded-2xl border border-amber-700/40 bg-amber-500/10 backdrop-blur-xl p-5 text-center">
        <p className="text-lg font-semibold text-white">
          وعده‌های آزاد این هفته تمام شده
        </p>
      </div>
    );
  }

  return (
    <div className="glass-tap rounded-2xl border border-amber-700/40 bg-amber-500/10 backdrop-blur-xl p-5 text-center">
      <h2 className="mb-3 text-xl font-semibold text-white">🍕 وعده آزاد</h2>

      <p className="text-white">
        {justUsed
          ? usedTodayMessage(status.weeklyCount)
          : `${toFaDigits(status.remaining)} از ${toFaDigits(status.weeklyCount)} وعده آزاد این هفته باقی مونده`}
      </p>

      {exhausted ? (
        <p className="mt-2 text-sm text-white">
          وعده‌های آزاد این هفته تمام شده
        </p>
      ) : (
        <button
          onClick={handleClick}
          className="mt-4 rounded-xl bg-avocado-yellow px-5 py-2 text-sm font-semibold text-black"
        >
          وعده آزادم رو امروز خوردم
        </button>
      )}
    </div>
  );
}
