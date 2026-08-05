import { useState } from "react";

import ModalOverlay from "@/components/ModalOverlay";
import {
  getCalorieTrackingMode,
  setCalorieTrackingMode,
  type CalorieTrackingMode,
} from "@/utils/calorieModeEngine";
import { hasTodaysLoggedEntries, resetDailyLog } from "@/utils/dailyLogEngine";

export interface CalorieModePickerModalProps {
  open: boolean;
  onClose: () => void;
}

export default function CalorieModePickerModal({
  open,
  onClose,
}: CalorieModePickerModalProps) {
  const [mode, setMode] = useState<CalorieTrackingMode>(
    () => getCalorieTrackingMode() ?? "perMeal",
  );

  if (!open) {
    return null;
  }

  function handleSave() {
    const currentMode = getCalorieTrackingMode();
    const isActualChange = currentMode !== null && currentMode !== mode;

    if (isActualChange && hasTodaysLoggedEntries()) {
      const confirmed = window.confirm(
        "با تغییر روش ثبت کالری، غذاهایی که امروز ثبت کردی پاک می‌شن و قابل بازگردانی نیستن.\n\nادامه می‌دی؟",
      );

      if (!confirmed) {
        return;
      }

      resetDailyLog();
    }

    setCalorieTrackingMode(mode);

    if (isActualChange) {
      // Every page that depends on the mode (the meal tab, the side menu's
      // own subtitle) read it into local state once on mount — there's no
      // shared reactive store, so a full reload is what actually gets them
      // all to reflect the change, matching how the rest of the app handles
      // this (e.g. ProgramBuilderPage after updateWorkoutDay).
      window.location.reload();
      return;
    }

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
                ? "glass-selected text-white"
                : "glass-chip text-white"
            }`}
          >
            وعده‌ای
          </button>

          <button
            onClick={() => setMode("daily")}
            className={`glass-tap flex-1 rounded-xl py-4 font-bold transition-colors ${
              mode === "daily"
                ? "glass-selected text-white"
                : "glass-chip text-white"
            }`}
          >
            روزانه
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
