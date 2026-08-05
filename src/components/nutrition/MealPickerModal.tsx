import ModalOverlay from "@/components/ModalOverlay";
import type { MealSlot } from "@/data/nutrition/foodCatalog";

export interface MealPickerModalProps {
  open: boolean;
  options: MealSlot[];
  onClose: () => void;
  onPick: (meal: MealSlot) => void;
}

// The quick-add shortcut's first step in per-meal tracking mode, where
// there's no meal context yet — picking one here hands off to the same
// overview (MealOverviewModal) the rest of the app opens from a meal card.
export default function MealPickerModal({
  open,
  options,
  onClose,
  onPick,
}: MealPickerModalProps) {
  if (!open) {
    return null;
  }

  return (
    <ModalOverlay onClose={onClose}>
      <div className="glass-panel glass-static space-y-4 rounded-3xl p-6">
        <h2 className="text-center text-lg font-bold text-white">
          افزودن غذا
        </h2>

        <p className="text-center text-sm text-white/60">
          برای کدوم وعده ثبت کنم؟
        </p>

        <div className="grid grid-cols-2 gap-3">
          {options.map((option) => (
            <button
              key={option.id}
              onClick={() => onPick(option)}
              className="glass-chip glass-static flex flex-col items-center gap-2 rounded-2xl py-4 text-sm font-medium text-white"
            >
              <span className="text-2xl">{option.icon}</span>
              {option.title}
            </button>
          ))}
        </div>

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
