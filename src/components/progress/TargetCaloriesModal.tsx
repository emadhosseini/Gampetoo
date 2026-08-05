import { useState } from "react";
import { Minus, Plus } from "lucide-react";

import ModalOverlay from "@/components/ModalOverlay";
import { getCalorieTarget, setCalorieTarget } from "@/utils/dailyLogEngine";
import { toFaDigits } from "@/utils/numberFormat";

const STEP = 100;
const DEFAULT_CALORIES = 2000;

export interface TargetCaloriesModalProps {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
}

export default function TargetCaloriesModal({
  open,
  onClose,
  onSaved,
}: TargetCaloriesModalProps) {
  const [calories, setCalories] = useState(() => getCalorieTarget() ?? DEFAULT_CALORIES);

  if (!open) {
    return null;
  }

  function handleSave() {
    setCalorieTarget(calories);
    onSaved();
    onClose();
  }

  return (
    <ModalOverlay onClose={onClose}>
      <div className="glass-panel glass-static space-y-4 rounded-3xl p-6 text-center">
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
