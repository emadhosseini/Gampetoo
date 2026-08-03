import { useState } from "react";

import ModalOverlay from "@/components/ModalOverlay";
import WeightPicker from "@/components/WeightPicker";
import { getLatestWeight, logWeight } from "@/utils/weightEngine";

export interface WeightModalProps {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
}

// Deliberately a mirror of HeightModal — same shell, same title/picker/
// save/close stack, same wording. Weight used to be logged on its own full
// page (/settings/weight) while height was a popup, so the two halves of
// "record your measurements" looked like different features.
export default function WeightModal({ open, onClose, onSaved }: WeightModalProps) {
  const [weight, setWeight] = useState(() => getLatestWeight() ?? 70);

  if (!open) {
    return null;
  }

  function handleSave() {
    logWeight(weight);
    onSaved();
    onClose();
  }

  return (
    <ModalOverlay onClose={onClose}>
      <div className="glass-panel glass-static space-y-4 rounded-3xl p-6 text-center">
        <h2 className="text-lg font-bold text-white">وزن</h2>

        <WeightPicker value={weight} onChange={setWeight} />

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
