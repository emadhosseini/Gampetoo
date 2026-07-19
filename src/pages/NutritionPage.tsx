import { useNavigate } from "react-router-dom";

import MealCard from "../components/nutrition/MealCard";
import FreeMealCard from "../components/nutrition/FreeMealCard";
import WorkoutHeader from "../components/WorkoutHeader";

import {
  getActiveProgram,
  getCurrentMealPlan,
  hasProgramStarted,
} from "../utils/programEngine";

export default function NutritionPage() {
  const navigate = useNavigate();

  const started = hasProgramStarted();

  const plan = started
    ? getCurrentMealPlan()
    : getActiveProgram().nutrition.rest;

  const title = started
    ? plan.title
    : "تغذیه در روز بدون برنامه ورزشی";

  const enabledMeals = plan.meals.filter((meal) => meal.enabled ?? true);

  const hasSelections = enabledMeals.some(
    (meal) => meal.foods.length > 0,
  );

  if (!hasSelections) {
    return (
      <div className="mx-auto max-w-3xl space-y-6 px-4 py-6">
        <WorkoutHeader subtitle="🍽 تغذیه امروز" title={title} />

        <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6 text-center">
          <p className="text-zinc-300">
            شما برنامه غذایی انتخاب نکردین
          </p>

          <button
            onClick={() => navigate("/settings/nutrition")}
            className="mt-4 rounded-xl bg-emerald-500 px-5 py-3 text-sm font-semibold text-black"
          >
            رفتن به تنظیمات برنامه غذایی
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6 px-4 py-6">
      <WorkoutHeader subtitle="🍽 تغذیه امروز" title={title} />

      {enabledMeals.map((meal) => (
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

      <FreeMealCard message={plan.freeMeal} />
    </div>
  );
}
