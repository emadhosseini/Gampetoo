import { useState } from "react";
import { Minus, Plus } from "lucide-react";

import ModalOverlay from "@/components/ModalOverlay";
import { toFaDigits } from "@/utils/numberFormat";

const STEP = 50;
const DEFAULT_CALORIES = 200;

export interface ActivityLogModalProps {
  open: boolean;
  onClose: () => void;
  onLog: (calories: number) => void;
}

export default function ActivityLogModal({ open, onClose, onLog }: ActivityLogModalProps) {
  const [calories, setCalories] = useState(DEFAULT_CALORIES);

  if (!open) {
    return null;
  }

  function handleSave() {
    onLog(calories);
    onClose();
  }

  return (
    <ModalOverlay onClose={onClose}>
      <div className="glass-panel glass-static space-y-4 rounded-3xl p-6 text-center">
        <h2 className="text-lg font-bold text-white">ثبت فعالیت</h2>

        <p className="text-sm text-white/60">چند کالری سوزوندی؟</p>

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

        <button
          onClick={handleSave}
          disabled={calories <= 0}
          className="w-full glass-action rounded-2xl py-3 font-bold text-white disabled:cursor-not-allowed disabled:opacity-40"
        >
          ثبت
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
