import MealCard from "../components/nutrition/MealCard";

import { getCurrentMealPlan } from "../utils/programEngine";

export default function NutritionPage() {
  const plan = getCurrentMealPlan();

  return (
    <div className="mx-auto max-w-3xl space-y-6 px-4 py-6">
      <div>
        <h1 className="text-3xl font-bold text-white">
          🍽 تغذیه امروز
        </h1>

        <p className="mt-2 text-sm text-zinc-400">
          {plan.title}
        </p>
      </div>

      {plan.meals.map((meal) => (
        <MealCard key={meal.id} meal={meal} />
      ))}

      <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-5">
        <h2 className="mb-4 text-xl font-semibold text-white">
          🔄 جایگزین‌های غذایی
        </h2>

        <div className="space-y-5">
          {plan.substitutions.map((group) => (
            <div key={group.title}>
              <h3 className="mb-2 font-medium text-emerald-400">
                {group.title}
              </h3>

              <ul className="space-y-1 text-zinc-300">
                {group.foods.map((food) => (
                  <li key={food}>• {food}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-2xl border border-amber-700/40 bg-amber-500/10 p-5">
        <h2 className="mb-3 text-xl font-semibold text-amber-400">
          🍕 وعده آزاد
        </h2>

        <p className="text-zinc-200">
          {plan.freeMeal}
        </p>
      </div>
    </div>
  );
}