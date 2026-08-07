import { useState } from "react";
import { Pencil, Sliders } from "lucide-react";

import CalorieGoalChoiceModal from "@/components/progress/CalorieGoalChoiceModal";
import CalorieGoalModal from "@/components/progress/CalorieGoalModal";
import TargetCaloriesModal from "@/components/progress/TargetCaloriesModal";
import { CALORIE_GOAL_LABELS, getCalorieGoal } from "@/utils/calorieEngine";
import { getCalorieTarget } from "@/utils/dailyLogEngine";
import { toFaDigits } from "@/utils/numberFormat";

// null = nothing open. "choice" is always the entry point — both the
// no-target CTA and the pencil-edit button land there first, so the
// manual-vs-calculate decision is made the same way whether this is the
// first time or the hundredth.
type Screen = "choice" | "manual" | "calculate" | null;

export interface CalorieGoalCardProps {
  // Bumped after the goal is recalculated so the page around this card —
  // the chart's dashed target line above all — re-reads the new number.
  onSaved: () => void;
}

// Two states in one block: an invitation to calculate when there's no
// target yet, and the resulting number with an edit affordance once there
// is. Keyed off the target rather than the profile inputs, because the
// target can also have been set by hand from the row below this card — in
// that case there's a number to show but no calculated goal type, so the
// subtitle just says so instead of inventing one.
//
// In the filled state the content comes before the edit button, so RTL
// puts the numbers on the right where reading starts and the action on
// the left — the same order as the profile card and the rows below.
export default function CalorieGoalCard({ onSaved }: CalorieGoalCardProps) {
  const [screen, setScreen] = useState<Screen>(null);

  const target = getCalorieTarget();
  const goal = getCalorieGoal();

  return (
    <>
      {target === null ? (
        <button
          onClick={() => setScreen("choice")}
          className="glass-action flex w-full items-center justify-center gap-2 rounded-3xl py-4 font-bold text-white"
        >
          <Sliders size={20} />
          تنظیم کالری هدف من
        </button>
      ) : (
        <div className="glass-panel glass-static flex items-center justify-between rounded-3xl p-5">
          <div className="text-right">
            {/* Where the number came from, stated on the label itself: a
                hand-typed target and a calculated one look identical
                otherwise, and only one of them moves when the profile
                changes. getCalorieGoal() is null exactly when the target was
                set by hand from the row below — there's a number but no goal
                type behind it. */}
            <p className="text-xs text-white/60">
              هدف کالری روزانه ({goal !== null ? "محاسبه‌شده" : "دستی"})
            </p>

            <p className="mt-0.5 text-2xl font-bold text-white">
              {toFaDigits(target)}{" "}
              <span className="text-sm font-normal text-white/60">کالری</span>
            </p>

            {/* A chip rather than coloured text: this card sits low on the
                page, where the background gradient is at its brightest, and
                a mid-tone accent colour washed out completely there. */}
            <span className="glass-chip mt-1.5 inline-block rounded-full px-3 py-1 text-xs font-semibold text-white">
              {goal !== null ? CALORIE_GOAL_LABELS[goal] : "تنظیم‌شده به‌صورت دستی"}
            </span>
          </div>

          <button
            onClick={() => setScreen("choice")}
            aria-label="ویرایش هدف کالری"
            className="glass-chip flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-white"
          >
            <Pencil size={18} />
          </button>
        </div>
      )}

      <CalorieGoalChoiceModal
        open={screen === "choice"}
        onClose={() => setScreen(null)}
        onManual={() => setScreen("manual")}
        onCalculate={() => setScreen("calculate")}
      />

      {/* Reuses the exact same manual-entry form TargetCaloriesModal always
          was, rather than building a second one — "کالری هدف روزانه"'s
          stepper is the one true manual-entry UI regardless of which
          screen opened it. */}
      <TargetCaloriesModal
        open={screen === "manual"}
        onClose={() => setScreen(null)}
        onSaved={onSaved}
      />

      <CalorieGoalModal
        open={screen === "calculate"}
        onClose={() => setScreen(null)}
        onSaved={onSaved}
      />
    </>
  );
}
