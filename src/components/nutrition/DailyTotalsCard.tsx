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
 * The day added up across every meal, shown at the top of DailyLogPage in
 * both tracking modes. Daily mode's own single MealLogCard used to show
 * these same numbers itself and skip this card entirely — now that card is
 * just a plain list of today's meals (hideTotals), so this is the one
 * place either mode shows the day's calorie/macro summary.
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
