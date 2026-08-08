import { useMemo } from "react";

import type { MealSlot } from "@/data/nutrition/foodCatalog";
import { calculateProteinTarget, getCalorieGoal, proteinStanding } from "@/utils/calorieEngine";
import { getLoggedEntries } from "@/utils/dailyLogEngine";
import { getLatestWeight } from "@/utils/weightEngine";
import { toFaDigits } from "@/utils/numberFormat";
import MacroTotalsGrid from "@/components/nutrition/MacroTotalsGrid";

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

      <div className="mt-4">
        <MacroTotalsGrid totals={totals} proteinStanding={standing} />
      </div>

      {target && (
        <p className="mt-3 text-center text-xs text-white/50">
          هدف پروتئین: {toFaDigits(target.grams)} گرم
        </p>
      )}
    </div>
  );
}
