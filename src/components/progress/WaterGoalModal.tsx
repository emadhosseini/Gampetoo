import { useState } from "react";
import { Minus, Plus } from "lucide-react";

import ModalOverlay from "@/components/ModalOverlay";
import { toFaDigits } from "@/utils/numberFormat";
import {
  MAX_WATER_GOAL,
  MIN_WATER_GOAL,
  getWaterGoal,
  setWaterGoal,
} from "@/utils/waterEngine";

export interface WaterGoalModalProps {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
}

export default function WaterGoalModal({ open, onClose, onSaved }: WaterGoalModalProps) {
  const [goal, setGoal] = useState(getWaterGoal);

  if (!open) {
    return null;
  }

  function handleSave() {
    setWaterGoal(goal);
    onSaved();
  }

  return (
    <ModalOverlay onClose={onClose}>
      <div className="glass-panel glass-static space-y-4 rounded-3xl p-6 text-center">
        <h2 className="text-lg font-bold text-white">هدف روزانه آب</h2>

        <p className="text-sm text-white/60">هر روز چند لیوان آب می‌خوای بخوری؟</p>

        <div className="flex items-center justify-center gap-6">
          <button
            onClick={() => setGoal((g) => Math.max(MIN_WATER_GOAL, g - 1))}
            aria-label="کم کردن"
            className="glass-chip flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-white"
          >
            <Minus size={20} />
          </button>

          <span className="text-3xl font-bold text-white">{toFaDigits(goal)}</span>

          <button
            onClick={() => setGoal((g) => Math.min(MAX_WATER_GOAL, g + 1))}
            aria-label="زیاد کردن"
            className="glass-chip flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-white"
          >
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
