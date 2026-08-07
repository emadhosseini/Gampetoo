import { useMemo } from "react";

import type { MealSlot } from "@/data/nutrition/foodCatalog";
import {
  calculateProteinTarget,
  getCalorieGoal,
  proteinStanding,
  type ProteinStanding,
} from "@/utils/calorieEngine";
import { getLoggedEntries } from "@/utils/dailyLogEngine";
import { getLatestWeight } from "@/utils/weightEngine";
import { toFaDigits } from "@/utils/numberFormat";

// Ring colours for how the day's protein is going. Red reads as "short",
// which it is; yellow as "more than this is doing anything", not as a
// warning — eating past the target isn't harmful, it just isn't buying
// anything, so it shouldn't look like the same kind of problem as red.
const PROTEIN_RING: Record<ProteinStanding, string> = {
  under: "ring-2 ring-red-400/70",
  onTarget: "ring-2 ring-green-400/70",
  over: "ring-2 ring-amber-300/70",
};

const MACROS = [
  { key: "protein", label: "پروتئین" },
  { key: "carbs", label: "کربوهیدرات" },
  { key: "fat", label: "چربی" },
  { key: "fiber", label: "فیبر" },
] as const;

export interface DailyTotalsCardProps {
  slots: MealSlot[];
  // Bumped by the page after every add/edit/remove — same contract as
  // MealLogCard, since this reads the same storage with nothing reactive in
  // between.
  version: number;
}

/**
 * The day added up across every meal, for per-meal tracking mode.
 *
 * Daily mode doesn't render this: it has one slot, so its own card already
 * shows exactly these numbers and a second copy would just be the same card
 * twice. Per-meal mode had no total anywhere — each card knew its own meal
 * and nothing knew the day, which is the number a daily protein target has
 * to be judged against.
 */
export default function DailyTotalsCard({ slots, version }: DailyTotalsCardProps) {
  const totals = useMemo(() => {
    const entries = slots.flatMap((slot) => getLoggedEntries(slot.id));

    const sum = (pick: (entry: (typeof entries)[number]) => number | undefined) =>
      entries.reduce((total, entry) => total + (pick(entry) ?? 0), 0);

    return {
      calories: sum((e) => e.calories),
      protein: sum((e) => e.protein),
      carbs: sum((e) => e.carbs),
      fat: sum((e) => e.fat),
      fiber: sum((e) => e.fiber),
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slots, version]);

  // Needs a logged weight to mean anything — without one there's no target,
  // so the ring is left off rather than drawn against a guess.
  const weight = getLatestWeight();
  const target =
    weight !== null
      ? calculateProteinTarget(weight, getCalorieGoal() ?? "maintain")
      : null;

  const standing = target ? proteinStanding(totals.protein, target) : null;

  return (
    <div className="glass-panel glass-static rounded-2xl p-5">
      <p className="text-center text-sm text-white/60">مجموع امروز</p>

      <p className="mt-1 text-center text-2xl font-bold text-white">
        {toFaDigits(totals.calories)}{" "}
        <span className="text-sm font-normal text-white/60">کالری</span>
      </p>

      <div className="mt-4 grid grid-cols-4 gap-2">
        {MACROS.map((macro) => (
          <div
            key={macro.key}
            className={`glass-chip rounded-xl py-3 text-center ${
              macro.key === "protein" && standing ? PROTEIN_RING[standing] : ""
            }`}
          >
            <p className="text-xs text-white/60">{macro.label}</p>
            <p className="mt-1 text-sm font-bold text-white">
              {toFaDigits(totals[macro.key])}
            </p>
          </div>
        ))}
      </div>

      {target && (
        <p className="mt-3 text-center text-xs text-white/50">
          هدف پروتئین: {toFaDigits(target.grams)} گرم
        </p>
      )}
    </div>
  );
}
