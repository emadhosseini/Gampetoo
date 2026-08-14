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
  // Which day to total up — defaults to today inside dailyLogEngine.
  date?: string;
  // Whether `date` actually is today, so the "مجموع امروز" label can say
  // so honestly instead of claiming "today" while showing a different
  // day's total.
  isToday?: boolean;
}

/**
 * The day added up across every meal, shown at the top of DailyLogPage in
 * both tracking modes. Daily mode's own single MealLogCard used to show
 * these same numbers itself and skip this card entirely — now that card is
 * just a plain list of today's meals (hideTotals), so this is the one
 * place either mode shows the day's calorie/macro summary.
 */
export default function DailyTotalsCard({
  slots,
  version,
  date,
  isToday = true,
}: DailyTotalsCardProps) {
  const totals = useMemo(() => {
    const entries = slots.flatMap((slot) => getLoggedEntries(slot.id, date));

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
  }, [slots, version, date]);

  // Needs a logged weight to mean anything — without one there's no target,
  // so the ring is left off rather than drawn against a guess.
  const weight = getLatestWeight();
  const target =
    weight !== null
      ? calculateProteinTarget(weight, getCalorieGoal() ?? "maintain")
      : null;

  const standing = target ? proteinStanding(totals.protein, target) : null;

  return (
    // Label, total and protein goal all share one line above the macro
    // capsules instead of stacking into three of their own — with the
    // capsules themselves down to a single line too, that's as short as
    // this card gets without dropping anything it shows.
    <div className="glass-panel glass-static rounded-2xl p-2">
      {/* Both side items are flex-1 (flex-basis 0, equal growth), so they
          always take exactly half the leftover width each and the calorie
          total between them lands dead center — justify-between would
          instead position it by whatever space the two unequal-width
          labels happened to leave, which is what pushed it off-center. */}
      <div className="flex items-baseline gap-2 px-1">
        <p className="min-w-0 flex-1 truncate text-xs text-white/60">
          {isToday ? "مجموع امروز" : "مجموع این روز"}
        </p>

        <p className="shrink-0 text-base font-bold leading-none text-white">
          {toFaDigits(totals.calories)}{" "}
          <span className="text-xs font-normal text-white/60">کالری</span>
        </p>

        <p className="min-w-0 flex-1 truncate text-end text-[10px] text-white/50">
          {target ? `هدف پروتئین: ${toFaDigits(target.grams)} گرم` : ""}
        </p>
      </div>

      <div className="mt-1.5">
        <MacroTotalsGrid totals={totals} proteinStanding={standing} />
      </div>
    </div>
  );
}
