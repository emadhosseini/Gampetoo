import { Sparkles } from "lucide-react";

import ModalOverlay from "@/components/ModalOverlay";
import type { MealSlot } from "@/data/nutrition/foodCatalog";

export interface MealAddChoiceModalProps {
  meal: MealSlot | null;
  onClose: () => void;
  onAdd: () => void;
  onAddAi: () => void;
}

// The fork the "+" on a meal card lands on: pick how to log the food, then
// drill into either AddMealEntryModal (manual search, one item at a time) or
// AiMealEntryModal (free-text description). "+" used to jump straight to the
// manual screen, which made the AI route effectively invisible from the meal
// list.
//
// Deliberately just the choice — what's already logged for the meal is shown
// on the card itself now, so repeating it here would only put another tap
// between the user and the thing they pressed "+" to do.
export default function MealAddChoiceModal({
  meal,
  onClose,
  onAdd,
  onAddAi,
}: MealAddChoiceModalProps) {
  if (!meal) {
    return null;
  }

  return (
    <ModalOverlay onClose={onClose}>
      <div className="glass-panel glass-static space-y-4 rounded-3xl p-6">
        <h2 className="text-center text-lg font-bold text-white">
          افزودن به وعده {meal.title}
        </h2>

        <button
          onClick={onAdd}
          className="w-full glass-action rounded-2xl py-3 font-bold text-white"
        >
          افزودن تکی خوراکی‌ها
        </button>

        <button
          onClick={onAddAi}
          className="glass-tap selector-pill flex w-full items-center justify-center gap-2 rounded-2xl py-3 font-bold text-white"
        >
          <Sparkles size={18} className="text-avocado-yellow" />
          افزودن با هوش مصنوعی
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
