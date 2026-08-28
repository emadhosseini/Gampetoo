import { useMemo } from "react";

import type { MealSlot } from "@/data/nutrition/foodCatalog";
import {
  getCalorieGoal,
  getEffectiveProteinTarget,
  macroStanding,
  STANDING_COLOR,
} from "@/utils/calorieEngine";
import { getCalorieTarget, getLoggedEntries, getMacroTargets } from "@/utils/dailyLogEngine";
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

  // A manual protein target (see getMacroTargets) wins over the calculated
  // one; without either — no manual figure and no logged weight — there's
  // nothing to judge protein against, so its ring is left off.
  const weight = getLatestWeight();
  const macroTargets = getMacroTargets();
  const proteinTarget = getEffectiveProteinTarget(weight, getCalorieGoal() ?? "maintain");

  const standings = {
    protein: proteinTarget ? macroStanding(totals.protein, proteinTarget.grams) : null,
    carbs: macroTargets.carbs !== null ? macroStanding(totals.carbs, macroTargets.carbs) : null,
    fat: macroTargets.fat !== null ? macroStanding(totals.fat, macroTargets.fat) : null,
    fiber: macroTargets.fiber !== null ? macroStanding(totals.fiber, macroTargets.fiber) : null,
  };
  const targets = {
    protein: proteinTarget?.grams ?? null,
    carbs: macroTargets.carbs,
    fat: macroTargets.fat,
    fiber: macroTargets.fiber,
  };

  const calorieTarget = getCalorieTarget();
  const calorieStanding = calorieTarget ? macroStanding(totals.calories, calorieTarget) : null;
  const calorieColor = calorieStanding ? STANDING_COLOR[calorieStanding] : undefined;

  return (
    // Label, total and calorie goal all share one line above the macro
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

        <p className="shrink-0 text-base font-bold leading-none">
          <span style={{ color: calorieColor ?? "white" }}>{toFaDigits(totals.calories)}</span>{" "}
          <span className="text-xs font-normal text-white/60">کالری</span>
        </p>

        <p className="min-w-0 flex-1 truncate text-end text-[10px] text-white/50">
          {calorieTarget ? `از ${toFaDigits(calorieTarget)}` : ""}
        </p>
      </div>

      <div className="mt-1.5">
        <MacroTotalsGrid totals={totals} standings={standings} targets={targets} />
      </div>
    </div>
  );
}
