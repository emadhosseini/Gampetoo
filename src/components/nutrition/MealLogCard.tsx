import { Plus } from "lucide-react";

import type { MealSlot } from "@/data/nutrition/foodCatalog";
import { getLoggedEntries } from "@/utils/dailyLogEngine";
import { toFaDigits } from "@/utils/numberFormat";

export interface MealLogCardProps {
  meal: MealSlot;
  onOpen: (meal: MealSlot) => void;
}

export default function MealLogCard({ meal, onOpen }: MealLogCardProps) {
  const entries = getLoggedEntries(meal.id);

  const totalCalories = entries.reduce(
    (sum, entry) => sum + (entry.calories ?? 0),
    0,
  );

  return (
    <button
      onClick={() => onOpen(meal)}
      className="glass-panel flex w-full items-center justify-between gap-3 rounded-2xl p-5"
    >
      <div className="flex items-center gap-3">
        <span className="text-2xl">{meal.icon}</span>

        <div className="text-right">
          <h2 className="text-lg font-semibold text-white">{meal.title}</h2>

          <p className="text-sm text-white/70">
            {entries.length > 0
              ? `${toFaDigits(totalCalories)} کالری ثبت‌شده`
              : "چیزی ثبت نشده"}
          </p>
        </div>
      </div>

      <div
        aria-hidden="true"
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-avocado-lime text-black"
      >
        <Plus size={20} />
      </div>
    </button>
  );
}
