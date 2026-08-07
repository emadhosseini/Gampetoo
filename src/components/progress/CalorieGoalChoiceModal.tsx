import { Calculator, Pencil } from "lucide-react";

import ModalOverlay from "@/components/ModalOverlay";

export interface CalorieGoalChoiceModalProps {
  open: boolean;
  onClose: () => void;
  onManual: () => void;
  onCalculate: () => void;
}

// The fork "کالری هدف" lands on — same shape as MealAddChoiceModal's own
// pick-a-method screen. Type a number straight in, or work it out from
// Mifflin-St Jeor. Gender doesn't belong on either branch: it's a profile
// fact CalorieGoalModal now reads silently rather than asks for, same as
// age/height/weight already were.
export default function CalorieGoalChoiceModal({
  open,
  onClose,
  onManual,
  onCalculate,
}: CalorieGoalChoiceModalProps) {
  if (!open) {
    return null;
  }

  return (
    <ModalOverlay onClose={onClose}>
      <div className="glass-panel glass-static space-y-4 rounded-3xl p-6">
        <h2 className="text-center text-lg font-bold text-white">کالری هدف</h2>

        <button
          onClick={onManual}
          className="glass-tap selector-pill flex w-full items-center justify-center gap-2 rounded-2xl py-3 font-bold text-white"
        >
          <Pencil size={18} />
          وارد کردن کالری هدف دستی
        </button>

        <button
          onClick={onCalculate}
          className="w-full glass-action flex items-center justify-center gap-2 rounded-2xl py-3 font-bold text-white"
        >
          <Calculator size={18} />
          محاسبه کالری هدف
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
