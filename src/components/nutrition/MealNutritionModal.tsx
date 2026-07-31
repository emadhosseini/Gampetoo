import type { MealSection } from "@/types/nutrition";
import { getLoggedFoodIds } from "@/utils/dailyLogEngine";
import { toFaDigits } from "@/utils/numberFormat";

export interface MealNutritionModalProps {
  meal: MealSection | null;
  onClose: () => void;
}

// FoodItem only carries a per-food calorie value (no protein/carb/fiber
// breakdown), so calories logged is the one number this can honestly total —
// no fabricated macros.
export default function MealNutritionModal({
  meal,
  onClose,
}: MealNutritionModalProps) {
  if (!meal) {
    return null;
  }

  const loggedIds = new Set(getLoggedFoodIds(meal.id));
  const loggedFoods = meal.foods.filter((food) => loggedIds.has(food.id));

  const totalCalories = loggedFoods.reduce(
    (sum, food) => sum + (food.calories ?? 0),
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
          {toFaDigits(loggedFoods.length)} از {toFaDigits(meal.foods.length)}{" "}
          خوردنی این وعده ثبت شده
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
