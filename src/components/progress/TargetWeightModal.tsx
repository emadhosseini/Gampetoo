import { useState } from "react";

import WeightPicker from "@/components/WeightPicker";
import { getTargetWeight, setTargetWeight } from "@/utils/weightEngine";

export interface TargetWeightModalProps {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
}

export default function TargetWeightModal({
  open,
  onClose,
  onSaved,
}: TargetWeightModalProps) {
  const [weight, setWeight] = useState(() => getTargetWeight() ?? 70);

  if (!open) {
    return null;
  }

  function handleSave() {
    setTargetWeight(weight);
    onSaved();
    onClose();
  }

  return (
    <div
      className="pt-safe fixed inset-0 z-[70] flex items-center justify-center px-6 backdrop-blur-[30px]"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="glass-panel glass-static w-full max-w-sm space-y-4 rounded-3xl p-6 text-center"
      >
        <h2 className="text-lg font-bold text-white">وزن هدف</h2>

        <WeightPicker value={weight} onChange={setWeight} />

        <button
          onClick={handleSave}
          className="glass-tap w-full rounded-2xl bg-avocado-yellow py-3 font-bold text-black"
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
    </div>
  );
}
