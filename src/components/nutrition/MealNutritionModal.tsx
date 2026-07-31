import type { MealSlot } from "@/data/nutrition/foodCatalog";
import { getLoggedEntries } from "@/utils/dailyLogEngine";
import { toFaDigits } from "@/utils/numberFormat";

export interface MealNutritionModalProps {
  meal: MealSlot | null;
  onClose: () => void;
}

// Logged entries only carry a calorie value (no protein/carb/fiber
// breakdown), so calories logged is the one number this can honestly total —
// no fabricated macros.
export default function MealNutritionModal({
  meal,
  onClose,
}: MealNutritionModalProps) {
  if (!meal) {
    return null;
  }

  const entries = getLoggedEntries(meal.id);

  const totalCalories = entries.reduce(
    (sum, entry) => sum + (entry.calories ?? 0),
    0,
  );

  return (
    <div
      className="pt-safe fixed inset-0 z-[70] flex items-center justify-center bg-black/70 px-6 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-sm space-y-4 rounded-2xl border border-forest-600 bg-forest-700 p-6 shadow-2xl"
      >
        <h2 className="text-center text-lg font-bold text-white">
          ارزش غذایی {meal.title}
        </h2>

        <div className="glass-chip rounded-xl p-4 text-center">
          <p className="text-3xl font-bold text-avocado-yellow">
            {toFaDigits(totalCalories)}
          </p>

          <p className="mt-1 text-sm text-white">کیلوکالری خورده‌شده</p>
        </div>

        <p className="text-center text-sm text-white">
          {toFaDigits(entries.length)} خوردنی توی این وعده ثبت شده
        </p>

        <button
          onClick={onClose}
          className="glass-tap w-full rounded-2xl bg-avocado-yellow py-3 font-bold text-black"
        >
          باشه
        </button>
      </div>
    </div>
  );
}
