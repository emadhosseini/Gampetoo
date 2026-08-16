import { useState } from "react";
import { Minus, Plus } from "lucide-react";

import ModalOverlay from "@/components/ModalOverlay";
import {
  CALORIE_GOAL_LABELS,
  calculateProteinTarget,
  getCalorieGoal,
  setCalorieGoal,
  type CalorieGoal,
} from "@/utils/calorieEngine";
import { getCalorieTarget, setCalorieTarget } from "@/utils/dailyLogEngine";
import { getLatestWeight } from "@/utils/weightEngine";
import { toFaDigits } from "@/utils/numberFormat";

const STEP = 100;
const DEFAULT_CALORIES = 2000;

const GOALS: CalorieGoal[] = ["lose", "maintain", "gain"];

export interface TargetCaloriesModalProps {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
}

// Stating the calorie target by hand, with no calculation behind it.
//
// The goal picker is here for one reason: the protein target is computed
// from bodyweight and the goal (see calculateProteinTarget), never from the
// calorie figure. Without it, this screen could set a cutting calorie
// target while protein stayed on whatever the last calculation — or the
// "maintain" default — had decided, and nothing on this screen even hinted
// that a second number was involved.
export default function TargetCaloriesModal({
  open,
  onClose,
  onSaved,
}: TargetCaloriesModalProps) {
  const [calories, setCalories] = useState(() => getCalorieTarget() ?? DEFAULT_CALORIES);
  const [goal, setGoal] = useState<CalorieGoal>(() => getCalorieGoal() ?? "maintain");

  if (!open) {
    return null;
  }

  // Without a weigh-in there is no protein target to preview or to change —
  // said plainly below rather than shown against a guessed weight.
  const weight = getLatestWeight();
  const protein = weight !== null ? calculateProteinTarget(weight, goal) : null;

  function handleSave() {
    setCalorieTarget(calories);
    setCalorieGoal(goal);
    onSaved();
    onClose();
  }

  return (
    <ModalOverlay onClose={onClose}>
      <div className="glass-panel glass-static max-h-[85vh] space-y-4 overflow-y-auto rounded-3xl p-6 text-center">
        <h2 className="text-lg font-bold text-white">کالری هدف روزانه</h2>

        <div className="selector-pill flex items-center justify-between rounded-xl p-3">
          <button
            onClick={() => setCalories((c) => Math.max(0, c - STEP))}
            aria-label="کم کردن"
          >
            <Minus size={20} />
          </button>

          <span className="text-2xl font-bold text-white">{toFaDigits(calories)}</span>

          <button onClick={() => setCalories((c) => c + STEP)} aria-label="زیاد کردن">
            <Plus size={20} />
          </button>
        </div>

        <div>
          <p className="mb-2 text-right text-sm text-white/60">هدفت چیه؟</p>

          <div className="flex gap-2">
            {GOALS.map((option) => (
              <button
                key={option}
                onClick={() => setGoal(option)}
                className={`flex-1 rounded-xl px-2 py-3 text-sm font-bold text-white transition-colors ${
                  goal === option ? "glass-selected" : "glass-chip"
                }`}
              >
                {CALORIE_GOAL_LABELS[option]}
              </button>
            ))}
          </div>
        </div>

        <p className="glass-chip rounded-xl p-3 text-sm text-white/70">
          {protein
            ? `هدف پروتئین: ${toFaDigits(protein.grams)} گرم در روز`
            : "برای هدف پروتئین، اول وزنت رو ثبت کن"}
        </p>

        <button
          onClick={handleSave}
          className="w-full glass-action rounded-2xl py-3 font-bold text-white"
        >
          ذخیره
        </button>

        <button
          onClick={onClose}
          className="ghost-action w-full rounded-2xl py-3 font-medium text-white"
        >
          بستن
        </button>
      </div>
    </ModalOverlay>
  );
}
