import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import WorkoutHeader from "@/components/WorkoutHeader";
import { getCurrentMealPlan, hasProgramStarted } from "@/utils/programEngine";
import { getLoggedFoodIds, setLoggedFoodIds } from "@/utils/dailyLogEngine";
import { toFaDigits } from "@/utils/numberFormat";

export default function MealLogPage() {
  const { mealId } = useParams<{ mealId: string }>();
  const navigate = useNavigate();

  const plan = hasProgramStarted() ? getCurrentMealPlan() : null;
  const meal = plan?.meals.find((item) => item.id === mealId);

  const [loggedIds, setLoggedIds] = useState<Set<string>>(
    () => new Set(getLoggedFoodIds(mealId ?? "")),
  );

  if (!meal || !mealId) {
    return (
      <div className="px-5 pb-5 pt-10">
        <div className="glass-panel rounded-3xl p-6 text-center">
          <p className="text-white">این وعده پیدا نشد.</p>
        </div>
      </div>
    );
  }

  function toggleFood(foodId: string) {
    setLoggedIds((prev) => {
      const next = new Set(prev);

      if (next.has(foodId)) {
        next.delete(foodId);
      } else {
        next.add(foodId);
      }

      setLoggedFoodIds(mealId!, Array.from(next));

      return next;
    });
  }

  return (
    <div className="space-y-6 px-5 pb-5 pt-10">
      <WorkoutHeader subtitle="ثبت وعده" title={meal.title} />

      {meal.foods.length === 0 && (
        <div className="glass-panel rounded-3xl p-6 text-center">
          <p className="text-white">
            برای این وعده هنوز خوردنی‌ای انتخاب نشده.
          </p>
        </div>
      )}

      <div className="space-y-3">
        {meal.foods.map((food) => (
          <label
            key={food.id}
            className="glass-chip glass-static flex items-center gap-3 rounded-xl p-4"
          >
            <input
              type="checkbox"
              checked={loggedIds.has(food.id)}
              onChange={() => toggleFood(food.id)}
              className="h-5 w-5 shrink-0"
            />

            <span className="flex-1 font-medium text-white">
              {food.name}
              <span className="mr-2 text-sm text-white/60">
                {toFaDigits(food.amount)}
              </span>
            </span>

            {food.calories !== undefined && (
              <span className="text-sm text-white/70">
                {toFaDigits(food.calories)} کالری
              </span>
            )}
          </label>
        ))}
      </div>

      <button
        onClick={() => navigate(-1)}
        className="glass-tap w-full rounded-2xl bg-avocado-yellow py-4 text-lg font-bold text-black"
      >
        باشه
      </button>
    </div>
  );
}
