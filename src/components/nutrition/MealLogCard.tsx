import { ChevronLeft, Plus } from "lucide-react";

import type { MealSlot } from "@/data/nutrition/foodCatalog";
import { getLoggedEntries } from "@/utils/dailyLogEngine";
import { toFaDigits } from "@/utils/numberFormat";

export interface MealLogCardProps {
  meal: MealSlot;
  onAdd: (meal: MealSlot) => void;
  onShowNutrition: (meal: MealSlot) => void;
}

export default function MealLogCard({
  meal,
  onAdd,
  onShowNutrition,
}: MealLogCardProps) {
  const entries = getLoggedEntries(meal.id);

  const totalCalories = entries.reduce(
    (sum, entry) => sum + (entry.calories ?? 0),
    0,
  );

  return (
    <div className="glass-panel rounded-2xl p-5">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="text-2xl">{meal.icon}</span>

          <div>
            <h2 className="text-lg font-semibold text-white">
              {meal.title}
            </h2>

            <p className="text-sm text-white/70">
              {entries.length > 0
                ? `${toFaDigits(totalCalories)} کالری ثبت‌شده`
                : "چیزی ثبت نشده"}
            </p>
          </div>
        </div>

        <button
          onClick={() => onAdd(meal)}
          aria-label={`افزودن ${meal.title}`}
          className="glass-tap flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-avocado-lime text-black"
        >
          <Plus size={20} />
        </button>
      </div>

      <button
        onClick={() => onShowNutrition(meal)}
        className="glass-chip mt-4 flex w-full items-center justify-between rounded-xl p-4"
      >
        <ChevronLeft size={18} className="text-white" />

        <span className="text-sm text-white">ارزش غذایی {meal.title}</span>
      </button>
    </div>
  );
}
