import { useState } from "react";

import ModalOverlay from "@/components/ModalOverlay";
import HeightPicker from "@/components/HeightPicker";
import { getCurrentUserHeight, setCurrentUserHeight } from "@/utils/userEngine";

export interface HeightModalProps {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
}

export default function HeightModal({ open, onClose, onSaved }: HeightModalProps) {
  const [height, setHeight] = useState(() => getCurrentUserHeight() ?? 170);

  if (!open) {
    return null;
  }

  function handleSave() {
    setCurrentUserHeight(height);
    onSaved();
    onClose();
  }

  return (
    <ModalOverlay onClose={onClose}>
      <div className="glass-panel glass-static space-y-4 rounded-3xl p-6 text-center">
        <h2 className="text-lg font-bold text-white">قد</h2>

        <HeightPicker value={height} onChange={setHeight} />

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
    </ModalOverlay>
  );
}
