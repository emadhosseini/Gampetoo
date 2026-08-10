import { useState } from "react";
import { Minus, Plus } from "lucide-react";

import ModalOverlay from "@/components/ModalOverlay";
import Toggle from "@/components/Toggle";
import { toFaDigits } from "@/utils/numberFormat";

// Same stepper feel as ActivityLogModal's manual entry, since this is that
// same idea — how many calories did you burn — just folded into this popup
// instead of a separate screen.
const STEP = 50;
const DEFAULT_CALORIES = 200;

export interface WalkCompleteModalProps {
  open: boolean;
  onCancel: () => void;
  // null when the toggle was left off — "finish, don't log anything" is a
  // real, distinct choice from "log zero calories".
  onConfirm: (calories: number | null) => void;
}

// One popup, no hand-off to a second one: the rest day has no MET estimate
// to show (nothing tracks how long or how hard a walk was, unlike the
// workout day's own WorkoutCompleteModal), so in its place this offers a
// toggle that reveals a manual number entry right underneath it when
// switched on — same shape as the workout day's toggle, just with
// something to type instead of something already computed.
export default function WalkCompleteModal({
  open,
  onCancel,
  onConfirm,
}: WalkCompleteModalProps) {
  const [addCalories, setAddCalories] = useState(false);
  const [calories, setCalories] = useState(DEFAULT_CALORIES);

  if (!open) {
    return null;
  }

  return (
    <ModalOverlay onClose={onCancel}>
      <div className="glass-panel glass-static space-y-4 rounded-3xl p-6 text-center">
        <h2 className="text-lg font-bold text-white">پیاده‌روی امروز</h2>

        <div className="glass-chip glass-static flex items-center justify-between rounded-2xl p-3">
          <span className="text-sm font-medium text-white">
            اضافه کردن کالری سوخته‌شده
          </span>

          <Toggle checked={addCalories} onChange={() => setAddCalories((on) => !on)} />
        </div>

        {addCalories && (
          <div className="selector-pill flex items-center justify-between rounded-xl p-3">
            <button
              onClick={() => setCalories((c) => Math.max(0, c - STEP))}
              aria-label="کم کردن"
            >
              <Minus size={20} />
            </button>

            <span className="text-2xl font-bold text-white">
              {toFaDigits(calories)}
            </span>

            <button onClick={() => setCalories((c) => c + STEP)} aria-label="زیاد کردن">
              <Plus size={20} />
            </button>
          </div>
        )}

        <button
          onClick={() => onConfirm(addCalories ? calories : null)}
          className="w-full glass-action glass-action-static rounded-2xl py-3 font-bold text-white"
        >
          تایید
        </button>

        <button
          onClick={onCancel}
          className="ghost-action ghost-action-static w-full rounded-2xl py-3 font-medium text-white"
        >
          انصراف
        </button>
      </div>
    </ModalOverlay>
  );
}
