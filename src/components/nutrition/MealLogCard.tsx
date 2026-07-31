import { Plus } from "lucide-react";

import type { MealSlot } from "@/data/nutrition/foodCatalog";
import { getLoggedEntries } from "@/utils/dailyLogEngine";
import { toFaDigits } from "@/utils/numberFormat";

export interface MealLogCardProps {
  meal: MealSlot;
  // Tapping the "+" skips straight to the add-food screen; tapping anywhere
  // else on the card opens the overview of what's already logged.
  onOpen: (meal: MealSlot) => void;
  onAdd: (meal: MealSlot) => void;
}

export default function MealLogCard({
  meal,
  onOpen,
  onAdd,
}: MealLogCardProps) {
  const entries = getLoggedEntries(meal.id);

  const totalCalories = entries.reduce(
    (sum, entry) => sum + (entry.calories ?? 0),
    0,
  );

  return (
    <div className="glass-panel flex items-center justify-between gap-3 rounded-2xl p-5">
      <button
        onClick={() => onOpen(meal)}
        className="flex flex-1 items-center gap-3 text-right"
      >
        <span className="text-2xl">{meal.icon}</span>

        <div>
          <h2 className="text-lg font-semibold text-white">{meal.title}</h2>

          <p className="text-sm text-white/70">
            {entries.length > 0
              ? `${toFaDigits(totalCalories)} کالری ثبت‌شده`
              : "چیزی ثبت نشده"}
          </p>
        </div>
      </button>

      <button
        onClick={() => onAdd(meal)}
        aria-label={`افزودن ${meal.title}`}
        className="glass-tap flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-avocado-lime text-black"
      >
        <Plus size={20} />
      </button>
    </div>
  );
}
