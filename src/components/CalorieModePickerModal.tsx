import { useState } from "react";

import ModalOverlay from "@/components/ModalOverlay";
import {
  getCalorieTrackingMode,
  setCalorieTrackingMode,
  type CalorieTrackingMode,
} from "@/utils/calorieModeEngine";

export interface CalorieModePickerModalProps {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
}

export default function CalorieModePickerModal({
  open,
  onClose,
  onSaved,
}: CalorieModePickerModalProps) {
  const [mode, setMode] = useState<CalorieTrackingMode>(
    () => getCalorieTrackingMode() ?? "perMeal",
  );

  if (!open) {
    return null;
  }

  function handleSave() {
    setCalorieTrackingMode(mode);
    onSaved();
    onClose();
  }

  return (
    <ModalOverlay onClose={onClose}>
      <div className="glass-panel glass-static space-y-4 rounded-3xl p-6 text-center">
        <h2 className="text-lg font-bold text-white">روش ثبت کالری</h2>

        <div className="flex gap-3">
          <button
            onClick={() => setMode("perMeal")}
            className={`glass-tap flex-1 rounded-xl py-4 font-bold transition-colors ${
              mode === "perMeal"
                ? "bg-avocado-yellow text-black"
                : "selector-pill text-white"
            }`}
          >
            وعده‌ای
          </button>

          <button
            onClick={() => setMode("daily")}
            className={`glass-tap flex-1 rounded-xl py-4 font-bold transition-colors ${
              mode === "daily"
                ? "bg-avocado-yellow text-black"
                : "selector-pill text-white"
            }`}
          >
            روزانه
          </button>
        </div>

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
